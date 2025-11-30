import { Elysia } from "elysia";

// plug-ins
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";

// controllers
import { authController } from "./modules/auth/auth.controller";
import { transactionsController } from "./modules/transactions/transactions.controller";
import { categoriesController } from "./modules/categories/categories.controller";

// middlewares
import { logger } from "./shared/middlewares/logger";
import { rateLimit } from "./shared/middlewares/rate-limit";

export const app = new Elysia()
  .use(logger)
  .use(
    rateLimit({
      max: 100,
      duration: 60000, // 1 minute
      message: "Too many requests, please try again later.",
    })
  )
  .use(swagger())
  .use(cors({ origin: "https://jhondenisson.github.io" }))
  .use(authController)
  .use(transactionsController)
  .use(categoriesController)
  .listen(process.env.PORT || 3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
