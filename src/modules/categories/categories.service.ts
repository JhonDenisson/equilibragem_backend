import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { categories } from "../../db/schema";
import type { NewCategory } from "../../db/schema";

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

  async findAllByUser(userId: number) {
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
      .where(eq(categories.userId, userId));
  }

  async findByFlow(userId: number, flow: "income" | "expense") {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
        flow: categories.flow,
      })
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.flow, flow)));
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
