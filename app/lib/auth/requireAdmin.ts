import {
  requireRole,
  type AuthContext,
  type UserRole,
} from "./requireAuthContext";

type AdminAuthResult = {
  userId: string;
  role: "admin" | "owner";
};

export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  // Allow both "admin" and "owner" (owner supersedes admin)
  const ctx = (await requireRole(req, ["admin", "owner"])) as AuthContext & {
    role: UserRole;
  };

  if (ctx.role !== "admin" && ctx.role !== "owner") {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  return { userId: ctx.userId, role: ctx.role as "admin" | "owner" };
}
