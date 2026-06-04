"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth/AuthProvider";

type AllowedRole = "admin" | "moderator";

export default function AdminGuard({
  children,
  allowedRoles = ["admin"],
}: {
  children: ReactNode;
  allowedRoles?: AllowedRole[];
}) {
  const router = useRouter();
  const { role, isLoading, status } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!allowedRoles.includes(role as AllowedRole)) {
      router.replace("/");
    }
  }, [isLoading, role, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
          Loading admin access…
        </div>
      </main>
    );
  }

  if (!isLoading && status && status !== "Active") {
    const message = status === "Suspended" ? "Account Suspended" : "Account Banned";

    return (
      <main className="min-h-screen bg-black text-white p-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
          <div className="text-2xl font-black">{message}</div>
          <p className="mt-3 text-zinc-400">
            You don’t have access to the admin console.
          </p>
        </div>
      </main>
    );
  }

  if (!allowedRoles.includes(role as AllowedRole)) {
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
