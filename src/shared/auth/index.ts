import { jwt } from "@elysiajs/jwt";

export interface AuthUser {
  id: number;
  email: string;
}

export const jwtConfig = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET || "default_secret",
});

export const getAuthUser = async (
  authorization: string | undefined,
  jwtInstance: { verify: (token: string) => Promise<unknown> },
): Promise<AuthUser | null> => {
  if (!authorization) return null;

  const token = authorization.split(" ")[1];
  if (!token) return null;

  const payload = await jwtInstance.verify(token);
  if (!payload) return null;

  return payload as AuthUser;
};

export const requireAuth = async (
  authorization: string | undefined,
  jwtInstance: { verify: (token: string) => Promise<unknown> },
  set: { status?: number | string },
): Promise<AuthUser | { error: string }> => {
  const user = await getAuthUser(authorization, jwtInstance);

  if (!user) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  return user;
};

export const isAuthError = (result: AuthUser | { error: string }): result is { error: string } => {
  return "error" in result;
};
