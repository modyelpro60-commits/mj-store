"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowRight,
  Check,
  Loader2,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();
  const { language, translate } = useLanguage();
  const dir = language === "ar" ? "rtl" : "ltr";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [creating, setCreating] = useState(false);

  function onEmailChange(v: string) {
    setEmail(v);
    if (emailVerified || codeSent) {
      setEmailVerified(false);
      setCodeSent(false);
      setCode("");
    }
  }

  async function sendCode() {
    if (sending) return;
    if (!email.trim()) return toast.error(translate("register.toast.enterEmail"));
    setSending(true);
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (d.success) {
        setCodeSent(true);
        toast.success(translate("register.toast.codeSent"));
      } else {
        toast.error(d.error ?? translate("register.toast.sendFailed"));
      }
    } catch {
      toast.error(translate("register.toast.sendFailed"));
    }
    setSending(false);
  }

  async function verifyCode() {
    if (verifying) return;
    if (!code.trim()) return toast.error(translate("register.toast.enterCode"));
    setVerifying(true);
    try {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const d = await res.json();
      if (d.success) {
        setEmailVerified(true);
        toast.success(translate("register.toast.emailVerified"));
      } else {
        toast.error(d.error ?? translate("register.toast.invalidCode"));
      }
    } catch {
      toast.error(translate("register.toast.verifyFailed"));
    }
    setVerifying(false);
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    if (!name.trim()) return toast.error(translate("register.toast.enterName"));
    if (!emailVerified) return toast.error(translate("register.toast.verifyEmailFirst"));
    if (password.length < 6) return toast.error(translate("register.toast.passwordLength"));

    setCreating(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const d = await res.json();
      if (!d.success) {
        toast.error(d.error ?? translate("register.toast.createFailed"));
        setCreating(false);
        return;
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        toast.success(translate("register.toast.signInAfterCreate"));
        router.push("/login");
        return;
      }
      toast.success(translate("register.toast.welcome"));
      router.push("/account");
    } catch {
      toast.error(translate("register.toast.createFailed"));
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-5 py-14" dir={dir}>
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-200">
            <ShieldCheck className="h-3.5 w-3.5" /> {translate("register.badge")}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight">{translate("register.newTitle")}</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-6">
            {translate("register.newSubtitle")}
          </p>

          <form onSubmit={createAccount} className="mt-7 space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-zinc-300">{translate("register.nameLabel2")}</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 focus-within:border-purple-500/40">
                <User className="h-4 w-4 text-zinc-600" />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={translate("register.namePlaceholder2")}
                  className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
              </div>
            </div>

            {/* Email + verify */}
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-zinc-300">{translate("register.emailLabel2")}</label>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 space-y-2.5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 focus-within:border-purple-500/40" dir="ltr">
                    <Mail className="h-4 w-4 text-zinc-600" />
                    <input value={email} onChange={(e) => onEmailChange(e.target.value)} type="email" placeholder={translate("register.emailPlaceholder")} autoComplete="email"
                      disabled={emailVerified}
                      className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-70" />
                    {emailVerified && <Check className="h-4 w-4 text-emerald-400" />}
                  </div>
                  {!emailVerified && (
                    <button type="button" onClick={sendCode} disabled={sending}
                      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60 sm:w-auto sm:px-3 sm:text-xs">
                      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {codeSent ? translate("register.resendCode") : translate("register.sendCode")}
                    </button>
                  )}
                </div>

                {codeSent && !emailVerified && (
                  <div className="flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={translate("register.codePlaceholder")} inputMode="numeric" dir="ltr"
                      className="h-11 flex-1 min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-center text-sm tracking-[0.4em] text-white outline-none focus:border-purple-500/40" />
                    <button type="button" onClick={verifyCode} disabled={verifying}
                      className="shrink-0 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
                      {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : translate("register.verifyBtn")}
                    </button>
                  </div>
                )}

                {emailVerified && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> {translate("register.emailVerified")}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-zinc-300">{translate("login.passwordLabel")}</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 focus-within:border-purple-500/40" dir="ltr">
                <Lock className="h-4 w-4 text-zinc-600" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={translate("register.passwordPlaceholder")} autoComplete="new-password"
                  className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
              </div>
            </div>

            <button type="submit" disabled={creating || !emailVerified}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 font-black text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition hover:shadow-[0_0_44px_rgba(168,85,247,0.55)] disabled:cursor-not-allowed disabled:opacity-50">
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{translate("register.createBtn2")} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></>}
            </button>

            {!emailVerified && (
              <p className="text-center text-[11px] text-zinc-600">{translate("register.verifyEmailNotice")}</p>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            {translate("register.haveAccount")}{" "}
            <a href="/login" className="font-bold text-purple-300 underline underline-offset-4 hover:text-purple-200">
              {translate("register.loginLink")}
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
