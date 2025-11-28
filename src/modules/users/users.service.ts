import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";

export class UsersService {
  async findById(id: number) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }

  async findAll() {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users);
  }
}
