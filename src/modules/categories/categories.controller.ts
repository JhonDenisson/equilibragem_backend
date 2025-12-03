import { Elysia } from "elysia";
import { CategoriesService } from "./categories.service";
import {
  createCategorySchema,
  updateCategorySchema,
  queryCategoriesSchema,
} from "./categories.schema";
import { jwtConfig, isAuthError, requireAuth } from "../../shared/auth";

const categoriesService = new CategoriesService();

export const categoriesController = new Elysia({ prefix: "/categories" })
  .use(jwtConfig)
  .get("/", async ({ jwt, headers, query, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const validation = queryCategoriesSchema.safeParse(query);

    if (!validation.success) {
      set.status = 400;
      return { error: validation.error.errors };
    }

    return await categoriesService.findAllByUser(result.id, validation.data);
  })
  .get("/:id", async ({ jwt, headers, params: { id }, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const category = await categoriesService.findById(Number(id), result.id);

    if (!category) {
      set.status = 404;
      return { error: "Category not found" };
    }

    return category;
  })
  .post("/", async ({ jwt, headers, body, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const validation = createCategorySchema.safeParse(body);
    if (!validation.success) {
      set.status = 400;
      return { error: validation.error.errors };
    }

    const category = await categoriesService.create({
      ...validation.data,
      userId: result.id,
    });

    set.status = 201;
    return category;
  })
  .put("/:id", async ({ jwt, headers, params: { id }, body, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const validation = updateCategorySchema.safeParse(body);
    if (!validation.success) {
      set.status = 400;
      return { error: validation.error.errors };
    }

    const category = await categoriesService.update(Number(id), result.id, validation.data);

    if (!category) {
      set.status = 404;
      return { error: "Category not found" };
    }

    return category;
  })
  .delete("/:id", async ({ jwt, headers, params: { id }, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    const deleted = await categoriesService.delete(Number(id), result.id);

    if (!deleted) {
      set.status = 404;
      return { error: "Category not found" };
    }

    return { message: "Category deleted successfully" };
  });
