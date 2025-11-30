import { Elysia } from "elysia";

interface RateLimitOptions {
	/**
	 * Maximum number of requests allowed within the duration window
	 * @default 100
	 */
	max?: number;
	/**
	 * Duration window in milliseconds
	 * @default 60000 (1 minute)
	 */
	duration?: number;
	/**
	 * Custom error message when rate limit is exceeded
	 */
	message?: string;
	/**
	 * Function to generate a unique key for the client (default: IP address)
	 */
	keyGenerator?: (request: Request, server: unknown) => string;
	/**
	 * Skip rate limiting for certain requests
	 */
	skip?: (request: Request) => boolean;
	/**
	 * Whether to include rate limit headers in response
	 * @default true
	 */
	headers?: boolean;
}

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store.entries()) {
		if (now >= entry.resetAt) {
			store.delete(key);
		}
	}
}, 60000); // Cleanup every minute

function getClientIP(request: Request, server: unknown): string {
	// Try to get IP from common headers (for proxied requests)
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	const realIP = request.headers.get("x-real-ip");
	if (realIP) {
		return realIP;
	}

	// Fallback to server's requestIP if available (Bun/Elysia)
	if (
		server &&
		typeof server === "object" &&
		"requestIP" in server &&
		typeof (server as { requestIP: (req: Request) => { address: string } | null }).requestIP === "function"
	) {
		const ip = (server as { requestIP: (req: Request) => { address: string } | null }).requestIP(request);
		if (ip) {
			return ip.address;
		}
	}

	return "unknown";
}

export function rateLimit(options: RateLimitOptions = {}) {
	const {
		max = 100,
		duration = 60000,
		message = "Too many requests, please try again later.",
		keyGenerator = getClientIP,
		skip,
		headers = true,
	} = options;

	return new Elysia({ name: "rate-limit" })
		.derive({ as: "global" }, ({ request, server, set }) => {
			// Check if this request should be skipped
			if (skip?.(request)) {
				return {
					rateLimit: {
						limit: max,
						remaining: max,
						reset: 0,
					},
				};
			}

			const key = keyGenerator(request, server);
			const now = Date.now();

			let entry = store.get(key);

			// If no entry or entry has expired, create a new one
			if (!entry || now >= entry.resetAt) {
				entry = {
					count: 0,
					resetAt: now + duration,
				};
				store.set(key, entry);
			}

			// Increment the count
			entry.count++;

			const remaining = Math.max(0, max - entry.count);
			const reset = Math.ceil((entry.resetAt - now) / 1000);

			// Set rate limit headers
			if (headers) {
				set.headers["X-RateLimit-Limit"] = String(max);
				set.headers["X-RateLimit-Remaining"] = String(remaining);
				set.headers["X-RateLimit-Reset"] = String(reset);
			}

			return {
				rateLimit: {
					limit: max,
					remaining,
					reset,
				},
			};
		})
		.onBeforeHandle({ as: "global" }, ({ request, server, set }) => {
			// Check if this request should be skipped
			if (skip?.(request)) {
				return;
			}

			const key = keyGenerator(request, server);
			const entry = store.get(key);

			if (entry && entry.count > max) {
				const now = Date.now();
				const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

				set.status = 429;
				if (headers) {
					set.headers["Retry-After"] = String(retryAfter);
				}

				return {
					error: "Too Many Requests",
					message,
					retryAfter,
				};
			}
		});
}

// Preset configurations for common use cases
export const rateLimitPresets = {
	/**
	 * Strict rate limit for authentication endpoints
	 * 5 requests per minute
	 */
	auth: () =>
		rateLimit({
			max: 5,
			duration: 60000,
			message: "Too many authentication attempts, please try again later.",
		}),

	/**
	 * Standard API rate limit
	 * 100 requests per minute
	 */
	api: () =>
		rateLimit({
			max: 100,
			duration: 60000,
		}),

	/**
	 * Relaxed rate limit for read-heavy endpoints
	 * 300 requests per minute
	 */
	relaxed: () =>
		rateLimit({
			max: 300,
			duration: 60000,
		}),

	/**
	 * Very strict rate limit for sensitive operations
	 * 3 requests per 5 minutes
	 */
	strict: () =>
		rateLimit({
			max: 3,
			duration: 300000,
			message: "Rate limit exceeded. Please wait before trying again.",
		}),
};