"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  MessageSquare,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import ConfirmModal from "../ConfirmModal";

const navLinks = [
  { href: "/#products", labelKey: "nav.products", icon: Package },
  { href: "/#reviews", labelKey: "nav.reviews", icon: MessageSquare },
  { href: "/#contact", labelKey: "nav.contact", icon: ShoppingBag },
] as const;

export default function StorefrontNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, isLoading, signOut, profile } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement | null>(null);

  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();

      toast.success("Signed out successfully", {
        description: "See you again soon.",
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.refresh();
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      toast.error(message);
    } finally {
      setIsSigningOut(false);
      setShowLogoutModal(false);
    }
  }

  const isStaff = role === "admin" || role === "moderator";

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

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (langRef.current?.contains(target)) return;
      if (accountRef.current?.contains(target)) return;
      setLangOpen(false);
      setAccountOpen(false);
    },
    []
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const handler = () => setMobileMenuOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const fullName = profile?.full_name || profile?.email || "User";
  const initials = fullName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const currentLang = langOptions.find((o) => o.value === language);

  const isActive = (href: string) => {
    if (href === "/#products") return pathname === "/" || pathname.startsWith("/product");
    if (href === "/#reviews") return pathname === "/#reviews";
    if (href === "/#contact") return pathname === "/#contact";
    return false;
  };

  return (
    <>
      {/* Fixed-position wrapper — keeps navbar centered and floating above page */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-[1280px]"
      >
        {/* Floating glass capsule */}
        <div className="relative h-14 rounded-2xl border border-[rgba(168,85,247,0.12)] bg-[rgba(8,8,14,0.70)] backdrop-blur-[36px] shadow-[0_0_0_1px_rgba(168,85,247,0.04)_inset,0_8px_40px_rgba(0,0,0,0.50),0_0_60px_rgba(168,85,247,0.06)]">
          {/* Top-edge subtle highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent"
          />

          {/* Inner content */}
          <div className="relative flex h-full items-center justify-between gap-4 px-4 md:gap-6 md:px-6">
            {/* ── LEFT: Logo ── */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-[0_0_16px_rgba(168,85,247,0.28)] transition-all duration-250 group-hover:shadow-[0_0_24px_rgba(168,85,247,0.45)] group-hover:scale-105">
                <span className="text-base font-black text-white tracking-tight">M</span>
              </div>
              <span className="text-sm font-black tracking-[0.30em] text-white">
                MJ{" "}
                <span className="bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
                  STORE
                </span>
              </span>
            </Link>

            {/* ── CENTER: Navigation links ── */}
            <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="group relative flex items-center gap-1.5 py-1 text-sm font-medium transition-all duration-200"
                    style={{ color: active ? "#f4f4f5" : "#a1a1aa" }}
                  >
                    <Icon className="h-3.5 w-3.5 transition-all duration-200 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.30)]" />
                    <span className="transition-all duration-200 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.30)]">
                      {translate(link.labelKey)}
                    </span>
                    {/* Thin animated underline */}
                    <motion.span
                      className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400"
                      initial={false}
                      animate={{
                        opacity: active ? 1 : 0,
                        scaleX: active ? 1 : 0.3,
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ boxShadow: active ? "0 0 10px rgba(168,85,247,0.40)" : "none" }}
                    />
                  </a>
                );
              })}
            </nav>

            {/* ── RIGHT: Controls ── */}
            <div className="flex items-center gap-1.5 md:gap-2.5 ml-auto">
              {/* Language switcher */}
              <div ref={langRef} className="relative">
                <motion.button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={langOpen}
                  whileHover={{ borderColor: "rgba(168,85,247,0.30)" }}
                  className="flex h-8 items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-purple-500/25 hover:text-zinc-200"
                >
                  <span className="text-sm leading-none">{currentLang?.flag}</span>
                  <span className="hidden sm:inline">{currentLang?.label}</span>
                  <motion.span
                    animate={{ rotate: langOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-2.5 w-2.5 text-zinc-600" />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-[170px] rounded-xl border border-purple-500/20 bg-zinc-950/95 p-1.5 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                    >
                      {langOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setLanguage(opt.value);
                            setLangOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            opt.value === language
                              ? "bg-purple-500/12 text-white"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                          }`}
                        >
                          <span className="text-base leading-none">{opt.flag}</span>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User / Auth */}
              {!isLoading && (
                <div ref={accountRef} className="relative hidden md:block">
                  {!role ? (
                    <Link href="/login">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        className="h-8 rounded-lg border border-purple-500/30 bg-purple-600/15 px-3 text-sm font-medium text-purple-200 transition-all duration-200 hover:bg-purple-600/25 hover:border-purple-500/40"
                      >
                        {translate("nav.login")}
                      </motion.button>
                    </Link>
                  ) : (
                    <>
                      <motion.button
                        type="button"
                        onClick={() => setAccountOpen((v) => !v)}
                        whileHover={{ scale: 1.02 }}
                        className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-purple-500/25 hover:bg-purple-500/5"
                      >
                        <div className="relative shrink-0">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-[9px] font-black text-white shadow-[0_0_10px_rgba(168,85,247,0.18)]">
                            {initials}
                          </div>
                          <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border-[1.5px] border-[rgba(8,8,14,0.85)] bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.45)]" />
                        </div>
                        <span className="hidden lg:block max-w-[80px] truncate">{fullName}</span>
                        <motion.span
                          animate={{ rotate: accountOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-3 w-3 text-zinc-600" />
                        </motion.span>
                      </motion.button>

                      <AnimatePresence>
                        {accountOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ duration: 0.12, ease: "easeOut" }}
                            className="absolute right-0 mt-2 w-[210px] rounded-xl border border-purple-500/20 bg-zinc-950/95 p-1.5 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                          >
                            <Link
                              href="/account"
                              onClick={() => setAccountOpen(false)}
                              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/5 hover:text-zinc-100"
                            >
                              <User className="h-4 w-4 text-zinc-500" />
                              {translate("nav.account")}
                            </Link>

                            {isStaff && (
                              <Link
                                href="/admin"
                                onClick={() => setAccountOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/10"
                              >
                                <LayoutDashboard className="h-4 w-4 text-purple-400" />
                                Admin Panel
                              </Link>
                            )}

                            <hr className="mx-2 my-1 border-white/5" />

                            <button
                              type="button"
                              onClick={() => {
                                setAccountOpen(false);
                                setShowLogoutModal(true);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                            >
                              <LogOut className="h-4 w-4" />
                              {translate("nav.logout")}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition-all hover:border-purple-500/25 hover:text-zinc-200"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="mt-2 rounded-2xl border border-[rgba(168,85,247,0.10)] bg-[rgba(8,8,14,0.75)] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/5 hover:text-zinc-100"
                    >
                      <Icon className="h-4 w-4 text-zinc-500" />
                      {translate(link.labelKey)}
                    </a>
                  );
                })}

                <hr className="my-2 border-white/5" />

                {!role ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/10"
                    >
                      <User className="h-4 w-4" />
                      {translate("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <User className="h-4 w-4 text-zinc-500" />
                      {translate("nav.register")}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <User className="h-4 w-4 text-zinc-500" />
                      {translate("nav.account")}
                    </Link>

                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/10"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" />
                      {translate("nav.logout")}
                    </button>
                  </>
                )}

                <hr className="my-2 border-white/5" />

                <div className="flex flex-wrap gap-2 pt-1">
                  {langOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setLanguage(opt.value);
                        setMobileMenuOpen(false);
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                        opt.value === language
                          ? "border-purple-500/25 bg-purple-500/10 text-white"
                          : "border-white/10 text-zinc-400"
                      }`}
                    >
                      {opt.flag} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spacer for fixed navbar — prevents content from hiding behind it */}
      <div className="h-[68px]" />

      <ConfirmModal
        open={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="default"
        loading={isSigningOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
