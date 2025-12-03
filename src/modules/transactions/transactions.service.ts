import { eq, and, desc, gte, lte, type SQL } from "drizzle-orm";
import { db } from "../../db";
import { transactions, categories } from "../../db/schema";
import type { NewTransaction } from "../../db/schema";
import type { QueryTransactionsDTO } from "./transactions.schema";

export class TransactionsService {
  async findById(id: number, userId: number) {
    const [transaction] = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        description: transactions.description,
        amount: transactions.amount,
        flow: transactions.flow,
        type: transactions.type,
        date: transactions.date,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    return transaction;
  }

  async findByIdWithCategory(id: number, userId: number) {
    const [transaction] = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        description: transactions.description,
        amount: transactions.amount,
        flow: transactions.flow,
        type: transactions.type,
        date: transactions.date,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        },
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    return transaction;
  }

  async findAllByUser(userId: number, filters?: QueryTransactionsDTO) {
    const conditions: SQL[] = [eq(transactions.userId, userId)];

    if (filters?.flow) {
      conditions.push(eq(transactions.flow, filters.flow));
    }
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
    if (filters?.startDate) {
      conditions.push(gte(transactions.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.date, new Date(filters.endDate)));
    }

    return await db
      .select({
        id: transactions.id,
        categoryId: transactions.categoryId,
        description: transactions.description,
        amount: transactions.amount,
        flow: transactions.flow,
        type: transactions.type,
        date: transactions.date,
        createdAt: transactions.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        },
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(filters?.limit || 20)
      .offset(filters?.offset || 0);
  }

  async create(data: NewTransaction) {
    const [transaction] = await db.insert(transactions).values(data).returning();

    return transaction;
  }

  async update(id: number, userId: number, data: Partial<Omit<NewTransaction, "userId">>) {
    const [transaction] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    return transaction;
  }

  async delete(id: number, userId: number) {
    const [transaction] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    return transaction;
  }
}
