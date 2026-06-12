"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth/AuthProvider";
import { LoaderCircle } from "lucide-react";

type AllowedRole = "admin" | "moderator" | "owner";

export default function AdminGuard({
  children,
  allowedRoles = ["admin", "owner"],
}: {
  children: ReactNode;
  allowedRoles?: AllowedRole[];
}) {
  const router = useRouter();
  const { role, isLoading, status } = useAuth();

  // Owner can access any admin area
  const effectiveAllowed = [...allowedRoles, "owner"] as AllowedRole[];

  useEffect(() => {
    if (isLoading) return;

    if (status && status !== "Active") {
      router.replace("/login");
      return;
    }

    if (!effectiveAllowed.includes(role as AllowedRole)) {
      router.replace("/");
    }
  }, [isLoading, role, router, status]);

  const isAuthorized =
    !isLoading &&
    (!status || status === "Active") &&
    effectiveAllowed.includes(role as AllowedRole);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
          Loading admin access…
        </div>
      </main>
    );
  }

  if (status && status !== "Active") {
    const message = status === "Suspended" ? "Account Suspended" : "Account Banned";

    return (
      <main className="min-h-screen bg-black text-white p-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
          <div className="text-2xl font-black">{message}</div>
          <p className="mt-3 text-zinc-400">
            You don't have access to the admin console.
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
          Redirecting…
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

/* ─────────────────────────────────────────────────────────────────────
 *  AdminOnlyGuard
 *  Restricts a page to admin / owner roles only.
 *  Moderators (and anyone else) are immediately redirected to /admin/orders.
 * ───────────────────────────────────────────────────────────────────── */
export function AdminOnlyGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  const isAdminOrOwner = role === "admin" || role === "owner";

  useEffect(() => {
    if (isLoading) return;
    if (role && !isAdminOrOwner) {
      router.replace("/admin/orders");
    }
  }, [isLoading, role, router, isAdminOrOwner]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAdminOrOwner) return null;

  return <>{children}</>;
}

/* ─────────────────────────────────────────────────────────────────────
 *  OwnerOnlyGuard
 *  Restricts a page to the Owner role exclusively.
 *  Used for /admin/roles and other system-level pages.
 * ───────────────────────────────────────────────────────────────────── */
export function OwnerOnlyGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { role, isLoading, can } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!can("manage_roles")) {
      router.replace("/admin");
    }
  }, [isLoading, role, router, can]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!can("manage_roles")) return null;

  return <>{children}</>;
}
