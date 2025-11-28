import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { authController } from "./modules/auth/auth.controller";
import { usersController } from "./modules/users/users.controller";
import { logger } from "./shared/middlewares/logger";

export const app = new Elysia()
  .use(logger)
  .use(swagger())
  .use(cors())
  .use(authController)
  .use(usersController)
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
