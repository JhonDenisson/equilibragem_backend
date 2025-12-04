import { Elysia } from "elysia";
import { SummariesService } from "./summaries.service";
import {
  monthlySummaryQuerySchema,
  categorySummaryQuerySchema,
  cashFlowQuerySchema,
  monthComparisonQuerySchema,
} from "./summaries.schema";
import { jwtConfig, isAuthError, requireAuth } from "../../shared/auth";

const summariesService = new SummariesService();

export const summariesController = new Elysia({ prefix: "/summaries" })
  .use(jwtConfig)
  .get("/monthly", async ({ jwt, headers, set, query }) => {
    const authResult = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(authResult)) return authResult;

    const validation = monthlySummaryQuerySchema.safeParse(query);
    if (!validation.success) {
      set.status = 400;
      return {
        error: "Parâmetros inválidos",
        details: validation.error.flatten().fieldErrors,
      };
    }

    const { year, month } = validation.data;
    return await summariesService.getMonthlySummary(authResult.id, year, month);
  })
  // GET /summaries/by-category?startDate=...&endDate=...&flow=expense
  .get("/by-category", async ({ jwt, headers, set, query }) => {
    const authResult = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(authResult)) return authResult;

    const validation = categorySummaryQuerySchema.safeParse(query);
    if (!validation.success) {
      set.status = 400;
      return {
        error: "Parâmetros inválidos",
        details: validation.error.flatten().fieldErrors,
      };
    }

    const { startDate, endDate, flow } = validation.data;
    return await summariesService.getCategorySummary(
      authResult.id,
      new Date(startDate),
      new Date(endDate),
      flow,
    );
  })
  // GET /summaries/cash-flow?months=6
  .get("/cash-flow", async ({ jwt, headers, set, query }) => {
    const authResult = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(authResult)) return authResult;

    const validation = cashFlowQuerySchema.safeParse(query);
    if (!validation.success) {
      set.status = 400;
      return {
        error: "Parâmetros inválidos",
        details: validation.error.flatten().fieldErrors,
      };
    }

    const months = validation.data.months;
    return await summariesService.getCashFlow(authResult.id, months);
  })
  // GET /summaries/comparison?yearA=2024&monthA=5&yearB=2024&monthB=6
  .get("/comparison", async ({ jwt, headers, set, query }) => {
    const authResult = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(authResult)) return authResult;

    const validation = monthComparisonQuerySchema.safeParse(query);
    if (!validation.success) {
      set.status = 400;
      return {
        error: "Parâmetros inválidos",
        details: validation.error.flatten().fieldErrors,
      };
    }

    const { yearA, monthA, yearB, monthB } = validation.data;
    return await summariesService.getMonthComparison(authResult.id, yearA, monthA, yearB, monthB);
  });
