import { z } from "zod";

export const transactionFlowSchema = z.enum(["income", "expense"]);
export const transactionTypeSchema = z.enum(["fixed", "variable"]);

export const createTransactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
  flow: transactionFlowSchema,
  type: transactionTypeSchema,
  categoryId: z.number().int().positive().optional().nullable(),
  date: z.string().datetime({ message: "Data inválida" }),
});

export const updateTransactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido")
    .optional(),
  flow: transactionFlowSchema.optional(),
  type: transactionTypeSchema.optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  date: z.string().datetime({ message: "Data inválida" }).optional(),
});

export const queryTransactionsSchema = z.object({
  flow: transactionFlowSchema.optional(),
  type: transactionTypeSchema.optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDTO = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionsDTO = z.infer<typeof queryTransactionsSchema>;
