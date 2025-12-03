import { eq, and, type SQL } from "drizzle-orm";
import { db } from "../../db";
import { categories } from "../../db/schema";
import type { NewCategory } from "../../db/schema";
import type { QueryCategoriesDTO } from "./categories.schema";

export class CategoriesService {
  async findById(id: number, userId: number) {
    const [category] = await db
      .select({
        id: categories.id,
        userId: categories.userId,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
        flow: categories.flow,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    return category;
  }

  async findAllByUser(userId: number, filters?: QueryCategoriesDTO) {
    const conditions: SQL[] = [eq(categories.userId, userId)];

    if (filters?.flow) {
      conditions.push(eq(categories.flow, filters.flow));
    }

    return await db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
        flow: categories.flow,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .where(and(...conditions));
  }

  async create(data: NewCategory) {
    const [category] = await db.insert(categories).values(data).returning();

    return category;
  }

  async update(id: number, userId: number, data: Partial<Omit<NewCategory, "userId">>) {
    const [category] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return category;
  }

  async delete(id: number, userId: number) {
    const [category] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return category;
  }
}
