"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth/AuthProvider";
import { ArrowRight, ShieldCheck, User } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { role, isLoading, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 overflow-hidden">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
            <User className="h-4 w-4" />
            Account
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight">Your space</h1>
          <p className="mt-3 text-zinc-400 leading-6">
            {isLoading
              ? "Loading your account..."
              : role === "admin"
              ? "Admin access enabled. Manage products and orders."
              : role === "customer"
              ? "Customer access enabled. Keep enjoying premium instant delivery."
              : "You’re currently signed out."}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Role
              </div>
              <div className="mt-3 text-3xl font-black">
                {role ? role : "guest"}
              </div>
              {role === "admin" ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-xs font-bold text-purple-200">
                  <ShieldCheck className="h-4 w-4" />
                  ADMIN
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Quick actions
              </div>

              <div className="mt-4 space-y-3">
                {role === "admin" ? (
                  <Link href="/admin" className="block">
                    <motion.div
                      whileHover={{ y: -2, boxShadow: "0 0 60px rgba(168,85,247,0.22)" }}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-4"
                    >
                      <span className="font-bold">Go to Admin</span>
                      <ArrowRight className="h-5 w-5 text-purple-300" />
                    </motion.div>
                  </Link>
                ) : null}

                <div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ boxShadow: "0 0 60px rgba(168,85,247,0.22)", y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-600 px-4 py-4 font-bold text-white transition-all duration-300 hover:bg-purple-700"
                  >
                    Logout
                  </motion.button>
                  <p className="mt-2 text-sm text-zinc-400">
                    Logout won’t affect guest checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
