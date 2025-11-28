import { Elysia } from "elysia";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.schema";

export const authController = new Elysia({ prefix: "/auth" })
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
        }
    )
    .post(
        "/login",
        async ({ body, authService, set }) => {
            try {
                const user = await authService.login(body);
                return { message: "Login successful", user };
            } catch (error) {
                set.status = 401;
                return { error: (error as Error).message };
            }
        },
        {
            body: loginSchema,
        }
    );
