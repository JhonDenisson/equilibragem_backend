import { z } from "zod";

export const categoryFlowSchema = z.enum(["income", "expense"]);

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  icon: z.string().max(50).optional().nullable(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor inválida (use formato hex)")
    .optional()
    .nullable(),
  flow: categoryFlowSchema,
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo").optional(),
  icon: z.string().max(50).optional().nullable(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor inválida (use formato hex)")
    .optional()
    .nullable(),
  flow: categoryFlowSchema.optional(),
});

export const queryCategoriesSchema = z.object({
  flow: categoryFlowSchema.optional(),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;
export type QueryCategoriesDTO = z.infer<typeof queryCategoriesSchema>;
