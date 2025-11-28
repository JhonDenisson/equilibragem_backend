import { Elysia } from "elysia";
import { UsersService } from "./users.service";

export const usersController = new Elysia({ prefix: "/users" })
    .decorate("usersService", new UsersService())
    .get("/", async ({ usersService }) => {
        return await usersService.findAll();
    })
    .get("/:id", async ({ params: { id }, usersService, set }) => {
        const user = await usersService.findById(Number(id));
        if (!user) {
            set.status = 404;
            return { error: "User not found" };
        }
        return user;
    });
