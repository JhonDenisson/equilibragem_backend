import { z } from "zod";

export const monthlySummaryQuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, "Ano inválido")
    .transform((val) => Number.parseInt(val)),
  month: z
    .string()
    .regex(/^(0?[1-9]|1[0-2])$/, "Mês inválido (1-12)")
    .transform((val) => Number.parseInt(val)),
});

export const categorySummaryQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Data inicial inválida (use ISO 8601)" }),
  endDate: z.string().datetime({ message: "Data final inválida (use ISO 8601)" }),
  flow: z.enum(["income", "expense"]).optional(),
});

export const cashFlowQuerySchema = z.object({
  months: z
    .string()
    .regex(/^([1-9]|1[0-2])$/, "Quantidade de meses inválida (1-12)")
    .transform((val) => Number.parseInt(val))
    .optional()
    .default("6"),
});

export const monthComparisonQuerySchema = z.object({
  yearA: z
    .string()
    .regex(/^\d{4}$/, "Ano A inválido")
    .transform((val) => Number.parseInt(val)),
  monthA: z
    .string()
    .regex(/^(0?[1-9]|1[0-2])$/, "Mês A inválido (1-12)")
    .transform((val) => Number.parseInt(val)),
  yearB: z
    .string()
    .regex(/^\d{4}$/, "Ano B inválido")
    .transform((val) => Number.parseInt(val)),
  monthB: z
    .string()
    .regex(/^(0?[1-9]|1[0-2])$/, "Mês B inválido (1-12)")
    .transform((val) => Number.parseInt(val)),
});

export type MonthlySummaryQuery = z.infer<typeof monthlySummaryQuerySchema>;
export type CategorySummaryQuery = z.infer<typeof categorySummaryQuerySchema>;
export type CashFlowQuery = z.infer<typeof cashFlowQuerySchema>;
export type MonthComparisonQuery = z.infer<typeof monthComparisonQuerySchema>;

export interface MonthlySummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface CategorySummaryItem {
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  flow: "income" | "expense";
  total: number;
  transactionCount: number;
  percentage: number;
}

export interface CategorySummary {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  categories: CategorySummaryItem[];
}

export interface CashFlowItem {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export interface CashFlowSummary {
  months: number;
  data: CashFlowItem[];
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
}

export interface MonthData {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface MonthComparison {
  monthA: MonthData;
  monthB: MonthData;
  difference: {
    income: number;
    incomePercentage: number;
    expense: number;
    expensePercentage: number;
    balance: number;
    balancePercentage: number;
  };
}
