import { Elysia } from "elysia";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.schema";
import { jwtConfig, requireAuth, isAuthError } from "../../shared/auth";
import { rateLimitPresets } from "../../shared/middlewares/rate-limit";

export const authController = new Elysia({ prefix: "/auth" })
  .use(jwtConfig)
  .use(rateLimitPresets.auth())
  .decorate("authService", new AuthService())
  .post(
    "/register",
    async ({ body, authService, set }) => {
      try {
        const user = await authService.register(body);
        set.status = 201;
        return user;
      } catch (error) {
        set.status = 400;
        return { error: (error as Error).message };
      }
    },
    {
      body: registerSchema,
    },
  )
  .post(
    "/login",
    async ({ body, authService, jwt, set }) => {
      try {
        const user = await authService.login(body);
        const token = await jwt.sign({
          id: user.id,
          email: user.email,
        });
        return {
          message: "Login successful",
          user,
          token,
        };
      } catch (error) {
        set.status = 401;
        return { error: (error as Error).message };
      }
    },
    {
      body: loginSchema,
    },
  )
  .get("/profile", async ({ jwt, set, headers: { authorization } }) => {
    const result = await requireAuth(authorization, jwt, set);
    if (isAuthError(result)) return result;

    return result;
  });
