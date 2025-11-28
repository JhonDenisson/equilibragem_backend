import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import type { LoginDTO, RegisterDTO } from "./auth.schema";

export class AuthService {
  async register(data: RegisterDTO) {
    const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

    if (existingUser.length > 0) {
      throw new Error("User already exists");
    }

    const hashedPassword = await Bun.password.hash(data.password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      })
      .returning();

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };
  }

  async login(data: LoginDTO) {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await Bun.password.verify(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
