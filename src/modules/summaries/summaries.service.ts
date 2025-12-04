import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import { transactions, categories } from "../../db/schema";
import type {
  MonthlySummary,
  CategorySummary,
  CategorySummaryItem,
  CashFlowSummary,
  CashFlowItem,
  MonthComparison,
  MonthData,
} from "./summaries.schema";

export class SummariesService {
  /**
   * Retorna o resumo financeiro de um mês específico
   */
  async getMonthlySummary(userId: number, year: number, month: number): Promise<MonthlySummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await db
      .select({
        flow: transactions.flow,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        ),
      )
      .groupBy(transactions.flow);

    const incomeData = result.find((r) => r.flow === "income");
    const expenseData = result.find((r) => r.flow === "expense");

    const totalIncome = Number.parseFloat(incomeData?.total || "0");
    const totalExpense = Number.parseFloat(expenseData?.total || "0");

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: (incomeData?.count || 0) + (expenseData?.count || 0),
    };
  }

  /**
   * Retorna o resumo de gastos/receitas agrupados por categoria
   */
  async getCategorySummary(
    userId: number,
    startDate: Date,
    endDate: Date,
    flow?: "income" | "expense",
  ): Promise<CategorySummary> {
    const conditions = [
      eq(transactions.userId, userId),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate),
    ];

    if (flow) {
      conditions.push(eq(transactions.flow, flow));
    }

    // Busca totais gerais
    const totalsResult = await db
      .select({
        flow: transactions.flow,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(transactions.flow);

    const totalIncome = Number.parseFloat(
      totalsResult.find((r) => r.flow === "income")?.total || "0",
    );
    const totalExpense = Number.parseFloat(
      totalsResult.find((r) => r.flow === "expense")?.total || "0",
    );

    // Busca totais por categoria
    const categoryResults = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        flow: transactions.flow,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(
        transactions.categoryId,
        transactions.flow,
        categories.name,
        categories.icon,
        categories.color,
      )
      .orderBy(sql`SUM(${transactions.amount}) DESC`);

    const categorySummaries: CategorySummaryItem[] = categoryResults.map((row) => {
      const total = Number.parseFloat(row.total);
      const baseTotal = row.flow === "income" ? totalIncome : totalExpense;
      const percentage = baseTotal > 0 ? (total / baseTotal) * 100 : 0;

      return {
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        categoryIcon: row.categoryIcon,
        categoryColor: row.categoryColor,
        flow: row.flow,
        total,
        transactionCount: row.count,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalIncome,
      totalExpense,
      categories: categorySummaries,
    };
  }

  /**
   * Retorna o fluxo de caixa dos últimos N meses
   */
  async getCashFlow(userId: number, months: number): Promise<CashFlowSummary> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const result = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${transactions.date})::int`,
        month: sql<number>`EXTRACT(MONTH FROM ${transactions.date})::int`,
        flow: transactions.flow,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), gte(transactions.date, startDate)))
      .groupBy(
        sql`EXTRACT(YEAR FROM ${transactions.date})`,
        sql`EXTRACT(MONTH FROM ${transactions.date})`,
        transactions.flow,
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${transactions.date})`,
        sql`EXTRACT(MONTH FROM ${transactions.date})`,
      );

    // Agrupa por mês
    const monthsMap = new Map<string, CashFlowItem>();

    // Inicializa todos os meses do período
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthsMap.set(key, {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    // Preenche com os dados reais
    for (const row of result) {
      const key = `${row.year}-${row.month}`;
      const item = monthsMap.get(key);
      if (item) {
        const value = Number.parseFloat(row.total);
        if (row.flow === "income") {
          item.income = value;
        } else {
          item.expense = value;
        }
        item.balance = item.income - item.expense;
      }
    }

    const data = Array.from(monthsMap.values());

    const totals = data.reduce(
      (acc, item) => ({
        income: acc.income + item.income,
        expense: acc.expense + item.expense,
        balance: acc.balance + item.balance,
      }),
      { income: 0, expense: 0, balance: 0 },
    );

    return {
      months,
      data,
      totals,
    };
  }

  /**
   * Compara dois meses diferentes
   */
  async getMonthComparison(
    userId: number,
    yearA: number,
    monthA: number,
    yearB: number,
    monthB: number,
  ): Promise<MonthComparison> {
    const [dataA, dataB] = await Promise.all([
      this.getMonthlySummary(userId, yearA, monthA),
      this.getMonthlySummary(userId, yearB, monthB),
    ]);

    const monthDataA: MonthData = {
      year: dataA.year,
      month: dataA.month,
      totalIncome: dataA.totalIncome,
      totalExpense: dataA.totalExpense,
      balance: dataA.balance,
      transactionCount: dataA.transactionCount,
    };

    const monthDataB: MonthData = {
      year: dataB.year,
      month: dataB.month,
      totalIncome: dataB.totalIncome,
      totalExpense: dataB.totalExpense,
      balance: dataB.balance,
      transactionCount: dataB.transactionCount,
    };

    const calculatePercentage = (a: number, b: number): number => {
      if (a === 0) return b === 0 ? 0 : 100;
      return Math.round(((b - a) / Math.abs(a)) * 10000) / 100;
    };

    return {
      monthA: monthDataA,
      monthB: monthDataB,
      difference: {
        income: monthDataB.totalIncome - monthDataA.totalIncome,
        incomePercentage: calculatePercentage(monthDataA.totalIncome, monthDataB.totalIncome),
        expense: monthDataB.totalExpense - monthDataA.totalExpense,
        expensePercentage: calculatePercentage(monthDataA.totalExpense, monthDataB.totalExpense),
        balance: monthDataB.balance - monthDataA.balance,
        balancePercentage: calculatePercentage(monthDataA.balance, monthDataB.balance),
      },
    };
  }
}
