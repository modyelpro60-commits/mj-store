"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth/AuthProvider";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (role !== "admin") {
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

  if (role !== "admin") {
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
