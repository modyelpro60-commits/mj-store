"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useToast } from "../../components/toast/ToastProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { translate } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const userId = data?.user?.id;

      if (userId && fullName.trim()) {
        try {
          await supabase
            .from("profiles")
            .update({ full_name: fullName.trim() })
            .eq("id", userId);
        } catch {
          // no-op
        }
      }

      const signUpSession = data?.session ?? null;

      const sessionRes = signUpSession
        ? { data: { session: signUpSession } }
        : await supabase.auth.getSession();

      const hasSession = Boolean(sessionRes.data.session);

      if (!hasSession) {
        throw new Error(
          "Registration created your account, but automatic sign-in is not available. Please check your email confirmation status."
        );
      }

      router.push("/welcome?mode=register");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Register failed";
      setError(message);

      pushToast({
        type: "error",
        title: "Registration failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 overflow-hidden">
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
            {translate("register.title")}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight">
            {translate("register.title")}
          </h1>
          <p className="mt-3 text-zinc-400 leading-6">
            {translate("register.subtitle")}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-200">
                {translate("register.fullNameLabel")}
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                required
                autoComplete="name"
                disabled={loading}
                className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                placeholder={translate("register.fullNamePlaceholder")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-200">
                {translate("register.emailLabel")}
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                disabled={loading}
                className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                placeholder={translate("register.emailPlaceholder")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-200">
                {translate("register.passwordLabel")}
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="new-password"
                disabled={loading}
                className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                placeholder={translate("register.passwordPlaceholder")}
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
              aria-busy={loading}
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : null}
              {loading ? translate("register.creating") : translate("register.button")}
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </form>

          <div className="mt-6 text-sm text-zinc-400">
            {translate("register.hasAccount")}{" "}
            <a
              href="/login"
              className="text-purple-300 hover:text-purple-200 underline underline-offset-4"
            >
              {translate("register.login")}
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
