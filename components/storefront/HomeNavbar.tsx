"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../components/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import MJLogo from "../../components/branding/MJLogo";
import { useToast } from "../../components/toast/ToastProvider";
import { ButtonHTMLAttributes } from "react";

type NavButtonProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

function NavButton({
  className = "",
  children,
  onClick,
  disabled,
  type = "button",
}: NavButtonProps) {
  return (
    <motion.button
      whileHover={{
        boxShadow:
          "0 0 0 1px rgba(168,85,247,0.28), 0 0 30px rgba(168,85,247,0.18)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={[
        "rounded-xl px-4 py-2 text-sm font-bold transition-all border",
        "border-purple-500/25 bg-purple-500/10 text-purple-200 hover:bg-purple-500/15 hover:text-white",
        className,
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  );
}

export default function HomeNavbar() {
  const router = useRouter();
  const { role, isLoading, signOut } = useAuth();
  const { pushToast } = useToast();

  const { language, setLanguage } = useLanguage();

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

  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await signOut();
      pushToast({
        type: "success",
        title: "Signed out",
        message: "Redirecting…",
      });
      router.refresh();
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      pushToast({ type: "error", title: "Logout failed", message });
    } finally {
      setIsSigningOut(false);
    }
  }

  const ordersHref =
    role === "admin"
      ? "/admin/orders"
      : "/account?tab=orders";

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/45 border-b border-purple-500/10">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-3">
          <MJLogo size="sm" glow />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-zinc-300 font-semibold">
          <a href="#catalog" className="hover:text-white transition">
            Products
          </a>
          <Link href={ordersHref} className="hover:text-white transition">
            Orders
          </Link>
          <a href="#contact" className="hover:text-white transition">
            Contact
          </a>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div ref={langRef} className="relative">
            <motion.button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              whileHover={{
                boxShadow: "0 0 0 1px rgba(168,85,247,0.28), 0 0 34px rgba(168,85,247,0.16)",
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="border border-purple-500/30 hover:border-purple-500 px-4 py-2 rounded-xl transition flex items-center gap-2 bg-black/20"
            >
              <span className="text-sm font-semibold text-zinc-200">
                {langOptions.find((o) => o.value === language)?.flag}{" "}
                {langOptions.find((o) => o.value === language)?.label}
              </span>

              <motion.span
                animate={{ rotate: langOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <ChevronDown className="h-4 w-4 text-purple-200" />
              </motion.span>
            </motion.button>

            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: langOpen ? 1 : 0, y: langOpen ? 0 : -6, scale: langOpen ? 1 : 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ pointerEvents: langOpen ? "auto" : "none" }}
              className="absolute right-0 mt-2 w-[220px] rounded-[18px] border border-purple-500/25 bg-black/80 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.45)] overflow-hidden z-50"
            >
              <div className="py-2">
                {langOptions.map((opt) => {
                  const active = opt.value === language;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      role="menuitem"
                      whileHover={{
                        boxShadow: "0 0 0 1px rgba(168,85,247,0.22), 0 0 24px rgba(168,85,247,0.12)",
                      }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      onClick={() => {
                        setLanguage(opt.value);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                        active
                          ? "bg-purple-500/15 text-white"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{opt.flag}</span>
                      <span className="text-sm font-semibold">{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Optional auth logout (kept minimal) */}
          {!isLoading && role ? (
            <>
              <NavButton
                onClick={() => router.push("/account")}
                disabled={isSigningOut}
                type="button"
                className="hidden lg:inline-flex"
              >
                Account
              </NavButton>
              <NavButton
                onClick={handleLogout}
                disabled={isSigningOut}
                type="button"
                className="border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500/15 hover:text-white"
              >
                {isSigningOut ? "Signing out…" : "Logout"}
              </NavButton>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
