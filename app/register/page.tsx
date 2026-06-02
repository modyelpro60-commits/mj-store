"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, LoaderCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const userId = data?.user?.id;

      // Best-effort: after profile RLS is added, user should be allowed to update own row.
      // If RLS disallows it, the trigger will still create the profile; full_name can be edited later.
      if (userId && fullName.trim()) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName.trim() })
          .eq("id", userId);
      }

      router.replace("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 overflow-hidden">
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
            Register
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight">Create your account</h1>
          <p className="mt-3 text-zinc-400 leading-6">
            You can buy as a guest. Logging in unlocks your account and admin access (if you’re an admin).
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-200">
                Full name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                required
                className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-200">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-200">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <motion.button
              whileHover={{
                boxShadow: "0 0 70px rgba(168,85,247,0.22)",
                y: -2,
              }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-600 font-bold text-white transition-all duration-300 hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
              {loading ? "Creating..." : "Create account"}
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </form>

          <div className="mt-6 text-sm text-zinc-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-purple-300 hover:text-purple-200 underline underline-offset-4"
            >
              Login
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
