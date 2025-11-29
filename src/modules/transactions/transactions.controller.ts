import { Elysia } from "elysia";
import { TransactionsService } from "./transactions.service";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "./transactions.schema";
import {
  jwtConfig,
  getAuthUser,
  isAuthError,
  requireAuth,
} from "../../shared/auth";

const transactionsService = new TransactionsService();

export const transactionsController = new Elysia({ prefix: "/transactions" })
  .use(jwtConfig)
  .get("/", async ({ jwt, headers, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    return await transactionsService.findAllByUser(result.id);
  })
  .get("/:id", async ({ jwt, headers, params: { id }, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const transaction = await transactionsService.findByIdWithCategory(
      Number(id),
      result.id,
    );

    if (!transaction) {
      set.status = 404;
      return { error: "Transaction not found" };
    }

    return transaction;
  })
  .post("/", async ({ jwt, headers, body, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const validation = createTransactionSchema.safeParse(body);
    if (!validation.success) {
      set.status = 400;
      return { error: validation.error.errors };
    }

    const transaction = await transactionsService.create({
      ...validation.data,
      userId: result.id,
      date: new Date(validation.data.date),
    });

    set.status = 201;
    return transaction;
  })
  .put("/:id", async ({ jwt, headers, params: { id }, body, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const validation = updateTransactionSchema.safeParse(body);
    if (!validation.success) {
      set.status = 400;
      return { error: validation.error.errors };
    }

    const updateData = {
      ...validation.data,
      date: validation.data.date ? new Date(validation.data.date) : undefined,
    };

    const transaction = await transactionsService.update(
      Number(id),
      result.id,
      updateData,
    );

    if (!transaction) {
      set.status = 404;
      return { error: "Transaction not found" };
    }

    return transaction;
  })
  .delete("/:id", async ({ jwt, headers, params: { id }, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const deleted = await transactionsService.delete(Number(id), result.id);

    if (!deleted) {
      set.status = 404;
      return { error: "Transaction not found" };
    }

    return { message: "Transaction deleted successfully" };
  });
