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
  const [mounted, setMounted] = useState(false);

  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {/* Navbar entrance animation wrapper */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1200px] px-4"
      >
        {/* Premium floating capsule */}
        <div className="relative h-[72px] w-full rounded-full border border-[rgba(168,85,247,0.18)] bg-[rgba(10,10,12,0.75)] backdrop-blur-[24px] shadow-[0_0_60px_rgba(168,85,247,0.10),0_20px_80px_rgba(0,0,0,0.5)]">
          {/* Inner glow overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/[0.04] via-transparent to-fuchsia-500/[0.04]" />

          <div className="relative flex h-full items-center justify-between px-4 md:px-6">
            {/* ── LEFT: Logo ── */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              {/* Purple logo box 48x48 */}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-transform duration-300 group-hover:scale-105">
                <span className="text-xl font-black text-white">M</span>
              </div>
              {/* MJ STORE text */}
              <div className="hidden sm:block">
                <span className="text-lg font-black tracking-[6px] text-white">
                  MJ{" "}
                  <span className="bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
                    STORE
                  </span>
                </span>
              </div>
            </Link>

            {/* ── CENTER: Navigation ── */}
            <div className="hidden md:flex items-center justify-center gap-10">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="group relative flex items-center gap-2 text-sm font-semibold transition-all duration-300"
                    style={{
                      opacity: active ? 1 : 0.8,
                    }}
                  >
                    <Icon className="h-4 w-4 transition-all duration-300 group-hover:-translate-y-[2px] group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    <span className="transition-all duration-300 group-hover:-translate-y-[2px] group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      style={{
                        color: active ? "#fff" : "#a1a1aa",
                      }}
                    >
                      {translate(link.labelKey)}
                    </span>
                    {/* Active page indicator: small purple line */}
                    <span
                      className="absolute -bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400 transition-all duration-300"
                      style={{
                        opacity: active ? 1 : 0,
                        boxShadow: active ? "0 0 10px rgba(168,85,247,0.5)" : "none",
                      }}
                    />
                  </a>
                );
              })}
            </div>

            {/* ── RIGHT: All controls in one container ── */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Language switcher - compact dark glass */}
              <div ref={langRef} className="relative">
                <motion.button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={langOpen}
                  whileHover={{ borderColor: "rgba(168,85,247,0.4)" }}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 text-xs font-semibold text-zinc-300 transition-all duration-200 hover:border-purple-500/30 hover:text-white"
                >
                  <span>{currentLang?.flag}</span>
                  <span className="hidden sm:inline">{currentLang?.label}</span>
                  <motion.span
                    animate={{ rotate: langOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3 w-3 text-zinc-500" />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-[180px] rounded-2xl border border-purple-500/20 bg-zinc-950/95 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                    >
                      {langOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setLanguage(opt.value);
                            setLangOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                            opt.value === language
                              ? "bg-purple-500/15 text-white"
                              : "text-zinc-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="text-base">{opt.flag}</span>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User profile (desktop) */}
              {!isLoading && (
                <div ref={accountRef} className="relative hidden md:block">
                  {!role ? (
                    <Link href="/login">
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(168,85,247,0.15)" }}
                        className="h-10 rounded-xl border border-purple-500/30 bg-purple-600/20 px-4 text-sm font-semibold text-purple-200 transition-all duration-200 hover:bg-purple-600/30"
                      >
                        {translate("nav.login")}
                      </motion.button>
                    </Link>
                  ) : (
                    <>
                      {/* Premium user chip */}
                      <motion.button
                        type="button"
                        onClick={() => setAccountOpen((v) => !v)}
                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(168,85,247,0.12)" }}
                        className="flex h-12 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-purple-500/30"
                      >
                        {/* Avatar with online indicator */}
                        <div className="relative shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-xs font-black text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                            {initials}
                          </div>
                          {/* Online indicator - green dot */}
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgba(10,10,12,0.75)] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        </div>
                        <span className="hidden lg:block max-w-[100px] truncate">{fullName}</span>
                        <motion.span
                          animate={{ rotate: accountOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                        </motion.span>
                      </motion.button>

                      {/* Account dropdown */}
                      <AnimatePresence>
                        {accountOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 mt-2 w-[220px] rounded-2xl border border-purple-500/20 bg-zinc-950/95 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                          >
                            <Link
                              href="/account"
                              onClick={() => setAccountOpen(false)}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
                            >
                              <User className="h-4 w-4 text-zinc-500" />
                              {translate("nav.account")}
                            </Link>

                            {isStaff && (
                              <Link
                                href="/admin"
                                onClick={() => setAccountOpen(false)}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-purple-300 transition-all hover:bg-purple-500/10"
                              >
                                <LayoutDashboard className="h-4 w-4 text-purple-400" />
                                Admin Panel
                              </Link>
                            )}

                            <hr className="mx-3 my-2 border-white/5" />

                            <button
                              type="button"
                              onClick={() => {
                                setAccountOpen(false);
                                setShowLogoutModal(true);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-300"
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
                className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-white/[0.06] bg-white/[0.04] text-zinc-400 transition-all hover:border-purple-500/30 hover:text-white"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - matches capsule style */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-2 rounded-2xl border border-[rgba(168,85,247,0.15)] bg-[rgba(10,10,12,0.85)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <Icon className="h-4 w-4 text-zinc-500" />
                      {translate(link.labelKey)}
                    </a>
                  );
                })}

                <hr className="border-white/5" />

                {!role ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-purple-300 transition-all hover:bg-purple-500/10"
                    >
                      <User className="h-4 w-4" />
                      {translate("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/5"
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
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <User className="h-4 w-4 text-zinc-500" />
                      {translate("nav.account")}
                    </Link>

                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-purple-300 transition-all hover:bg-purple-500/10"
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
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" />
                      {translate("nav.logout")}
                    </button>
                  </>
                )}

                <hr className="border-white/5" />

                <div className="flex flex-wrap gap-2 pt-1">
                  {langOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setLanguage(opt.value);
                        setMobileMenuOpen(false);
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                        opt.value === language
                          ? "border-purple-500/30 bg-purple-500/10 text-white"
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
      </motion.nav>

      {/* Spacer to account for fixed navbar */}
      <div className="h-[88px]" />

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
