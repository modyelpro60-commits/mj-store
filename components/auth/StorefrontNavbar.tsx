"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useToast } from "../toast/ToastProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export default function StorefrontNavbar() {
  const router = useRouter();
  const { role, isLoading, signOut } = useAuth();
  const { pushToast } = useToast();

  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      pushToast({
        type: "success",
        title: translate("toast.signedOutTitle"),
        message: translate("toast.signedOutMessage"),
      });

      // Ensure navbar updates instantly.
      router.refresh();
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      pushToast({
        type: "error",
        title: translate("toast.logoutFailedTitle"),
        message,
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  const navRole = role;

  const { language, translate, setLanguage } = useLanguage();

  const langOptions = useMemo(
    () =>
      [
        { value: "en", flag: "🇬🇧", label: "English" },
        { value: "ar", flag: "🇪🇬", label: "العربية" },
        { value: "fr", flag: "🇫🇷", label: "Français" },
      ] as const,
    []
  );

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!langRef.current) return;
      if (!langOpen) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (langRef.current.contains(target)) return;
      setLangOpen(false);
    }

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [langOpen]);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-purple-500/20 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
      <div className="max-w-[1600px] mx-auto px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-[8px] drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]">
            MJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400">STORE</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-12 text-zinc-300 font-semibold">
          <a href="#products" className="relative hover:text-white transition after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-purple-400 after:to-fuchsia-400 after:transition-transform after:duration-300 hover:after:scale-x-100">
            {translate("nav.products")}
          </a>
          <a href="#reviews" className="relative hover:text-white transition after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-purple-400 after:to-fuchsia-400 after:transition-transform after:duration-300 hover:after:scale-x-100">
            {translate("nav.reviews")}
          </a>
          <a href="#contact" className="relative hover:text-white transition after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-purple-400 after:to-fuchsia-400 after:transition-transform after:duration-300 hover:after:scale-x-100">
            {translate("nav.contact")}
          </a>
        </div>

        <div className="flex items-center gap-6">
          <div ref={langRef} className="relative">
            <motion.button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              whileHover={{
                boxShadow:
                  "0 0 0 1px rgba(168,85,247,0.32), 0 0 40px rgba(168,85,247,0.2)",
                borderColor: "rgba(168,85,247,0.5)"
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="border border-purple-500/30 hover:border-purple-500/50 px-5 py-3 rounded-xl transition flex items-center gap-2 bg-black/30 backdrop-blur-sm font-semibold"
            >
              <span className="text-sm text-zinc-100">
                {langOptions.find((o) => o.value === language)?.flag}{" "}
                {langOptions.find((o) => o.value === language)?.label}
              </span>

              <motion.span
                animate={{ rotate: langOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <ChevronDown className="h-4 w-4 text-purple-300" />
              </motion.span>
            </motion.button>

            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: langOpen ? 1 : 0, y: langOpen ? 0 : -8, scale: langOpen ? 1 : 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ pointerEvents: langOpen ? "auto" : "none" }}
              className="absolute right-0 mt-3 w-[240px] rounded-[18px] border border-purple-500/30 bg-black/85 backdrop-blur-xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden z-50"
            >
              <div className="py-3">
                {langOptions.map((opt) => {
                  const active = opt.value === language;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      role="menuitem"
                      whileHover={{
                        boxShadow:
                          "0 0 0 1px rgba(168,85,247,0.28), 0 0 30px rgba(168,85,247,0.16)",
                      }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      onClick={() => {
                        setLanguage(opt.value);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition font-semibold ${
                        active
                          ? "bg-purple-500/20 text-white border-l-2 border-l-purple-500"
                          : "text-zinc-300 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{opt.flag}</span>
                      <span className="text-sm">{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <a href="#products">
            <motion.button 
              whileHover={{ y: -2, boxShadow: "0 0 50px rgba(168,85,247,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-8 py-3.5 rounded-xl font-black tracking-wide transition shadow-[0_0_40px_rgba(168,85,247,0.25)] border border-purple-400/30"
            >
              {translate("nav.buyNow")}
            </motion.button>
          </a>

          {/* Auth area */}
          {!isLoading && !navRole ? (
            <>
              <Link href="/login">
                <motion.button 
                  whileHover={{ boxShadow: "0 0 35px rgba(168,85,247,0.16)" }}
                  className="border border-purple-500/30 hover:border-purple-500 px-5 py-3 rounded-xl transition font-semibold text-zinc-100"
                >
                  {translate("nav.login")}
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button 
                  whileHover={{ boxShadow: "0 0 35px rgba(168,85,247,0.16)" }}
                  className="bg-purple-600/20 hover:bg-purple-600/30 px-5 py-3 rounded-xl transition font-semibold text-white border border-purple-500/30"
                >
                  {translate("nav.register")}
                </motion.button>
              </Link>
            </>
          ) : null}

          {!isLoading && navRole === "customer" ? (
            <>
              <Link href="/account">
                <motion.button 
                  whileHover={{ boxShadow: "0 0 35px rgba(168,85,247,0.16)" }}
                  className="bg-purple-600/20 hover:bg-purple-600/30 px-5 py-3 rounded-xl transition font-semibold text-white border border-purple-500/30"
                >
                  {translate("nav.account")}
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ boxShadow: "0 0 35px rgba(168,85,247,0.16)" }}
                onClick={handleLogout}
                disabled={isSigningOut}
                aria-busy={isSigningOut}
                className="border border-purple-500/30 hover:border-purple-500 px-5 py-3 rounded-xl transition font-semibold text-zinc-100 disabled:opacity-60"
              >
                {isSigningOut ? translate("auth.signingOut") : translate("nav.logout")}
              </motion.button>
            </>
          ) : null}

          {!isLoading && navRole === "admin" ? (
            <>
              <Link href="/account">
                <motion.button 
                  whileHover={{ boxShadow: "0 0 35px rgba(168,85,247,0.16)" }}
                  className="bg-purple-600/20 hover:bg-purple-600/30 px-5 py-3 rounded-xl transition font-semibold text-white border border-purple-500/30"
                >
                  {translate("nav.account")}
                </motion.button>
              </Link>

              <Link href="/admin">
                <motion.button 
                  whileHover={{ y: -2, boxShadow: "0 0 40px rgba(168,85,247,0.25)" }}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-6 py-3 rounded-xl transition font-black text-white border border-purple-400/30"
                >
                  {translate("nav.admin")}
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ boxShadow: "0 0 35px rgba(168,85,247,0.16)" }}
                onClick={handleLogout}
                disabled={isSigningOut}
                aria-busy={isSigningOut}
                className="border border-purple-500/30 hover:border-purple-500 px-5 py-3 rounded-xl transition font-semibold text-zinc-100 disabled:opacity-60"
              >
                {isSigningOut ? translate("auth.signingOut") : translate("nav.logout")}
              </motion.button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
