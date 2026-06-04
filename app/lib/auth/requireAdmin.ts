import {
  requireRole,
  type AuthContext,
  type UserRole,
} from "./requireAuthContext";

type AdminAuthResult = {
  userId: string;
  role: "admin";
};

export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const ctx = (await requireRole(req, ["admin"])) as AuthContext & {
    role: UserRole;
  };

  if (ctx.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  return { userId: ctx.userId, role: "admin" };
}
