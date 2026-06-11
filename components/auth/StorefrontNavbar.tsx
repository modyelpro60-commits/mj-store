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
  MessageSquare,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import ConfirmModal from "../ConfirmModal";

/* ── Nav links config ──────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "/#products", labelKey: "nav.products", icon: Package },
  { href: "/#reviews",  labelKey: "nav.reviews",  icon: MessageSquare },
  { href: "/#contact",  labelKey: "nav.contact",  icon: ShoppingBag },
] as const;

const LANG_OPTIONS = [
  { value: "en", flag: "🇬🇧", label: "English"  },
  { value: "ar", flag: "🇪🇬", label: "العربية"  },
  { value: "fr", flag: "🇫🇷", label: "Français" },
] as const;

/* ── Online pulse dot ──────────────────────────────────────────── */
function OnlineDot({ size = "md" }: { size?: "sm" | "md" }) {
  const ring = size === "sm" ? "h-[7px] w-[7px]" : "h-2 w-2";
  return (
    <span className="relative inline-flex shrink-0">
      <span className={`relative ${ring} rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]`} />
      <motion.span
        aria-hidden
        className={`absolute inset-0 rounded-full bg-emerald-400`}
        animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  STOREFRONT NAVBAR
 * ══════════════════════════════════════════════════════════════════ */

export default function StorefrontNavbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { role, isLoading, signOut, profile } = useAuth();
  const { language, translate, setLanguage }  = useLanguage();

  /* ── State ────────────────────────────────────────────────────── */
  const [isSigningOut,     setIsSigningOut]     = useState(false);
  const [showLogoutModal,  setShowLogoutModal]  = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [accountOpen,      setAccountOpen]      = useState(false);
  const [langOpen,         setLangOpen]         = useState(false);
  const [scrolled,         setScrolled]         = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);

  /* ── Scroll detection (for shadow intensity) ──────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Click outside ────────────────────────────────────────────── */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const t = e.target as Node | null;
    if (!t) return;
    if (!langRef.current?.contains(t))    setLangOpen(false);
    if (!accountRef.current?.contains(t)) setAccountOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  /* ── Close mobile on popstate ─────────────────────────────────── */
  useEffect(() => {
    const h = () => setMobileOpen(false);
    window.addEventListener("popstate", h);
    return () => window.removeEventListener("popstate", h);
  }, []);

  /* ── Logout ───────────────────────────────────────────────────── */
  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      toast.success(translate("nav.signOut"));
      await new Promise((r) => setTimeout(r, 800));
      router.refresh();
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setIsSigningOut(false);
      setShowLogoutModal(false);
    }
  }

  /* ── Derived ──────────────────────────────────────────────────── */
  const isAdmin     = role === "admin";
  const isModerator = role === "moderator";
  const isLoggedIn  = !!role && !isLoading;

  const fullName = profile?.full_name || profile?.email || "User";
  const initials = fullName.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);
  const currentLang = LANG_OPTIONS.find((o) => o.value === language);

  const isActive = (href: string) => {
    if (href === "/#products") return pathname === "/" || pathname.startsWith("/product");
    return false;
  };

  const closeAll = () => {
    setAccountOpen(false);
    setMobileOpen(false);
    setLangOpen(false);
  };

  /* ── RENDER ───────────────────────────────────────────────────── */
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-3.5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[1300px]"
      >
        {/* ── MAIN BAR ────────────────────────────────────────────── */}
        <div
          className={`relative h-[58px] rounded-2xl border border-white/[0.07] transition-all duration-500 ${
            scrolled
              ? "bg-[rgba(7,7,15,0.90)] shadow-[0_8px_50px_rgba(0,0,0,0.55),0_0_0_1px_rgba(168,85,247,0.08)_inset] backdrop-blur-[44px]"
              : "bg-[rgba(9,9,18,0.75)] shadow-[0_4px_32px_rgba(0,0,0,0.40),0_0_0_1px_rgba(168,85,247,0.05)_inset] backdrop-blur-[36px]"
          }`}
        >
          {/* Top shimmer edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/15 to-transparent"
          />

          <div className="flex h-full items-center justify-between gap-4 px-4 md:px-5">

            {/* ── LOGO ──────────────────────────────────────────── */}
            <Link href="/" className="group flex items-center gap-2.5 shrink-0">
              {/* Icon mark */}
              <div className="relative flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-[0_0_18px_rgba(168,85,247,0.32)] transition-all duration-300 group-hover:shadow-[0_0_28px_rgba(168,85,247,0.52)] group-hover:scale-[1.06]">
                <span className="text-[13px] font-black text-white tracking-tighter select-none">M</span>
              </div>
              {/* Wordmark */}
              <span className="hidden sm:block text-[13px] font-black tracking-[0.28em] text-white">
                MJ{" "}
                <span className="bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
                  STORE
                </span>
              </span>
            </Link>

            {/* ── CENTER: Nav links ──────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map((link) => {
                const Icon   = link.icon;
                const active = isActive(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`group relative flex items-center gap-1.5 py-1 text-[13px] font-medium transition-all duration-200 ${
                      active ? "text-white" : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    <Icon className={`h-[13px] w-[13px] transition-all duration-200 ${active ? "text-purple-400" : "group-hover:text-purple-400/70"}`} />
                    {translate(link.labelKey)}
                    <motion.span
                      aria-hidden
                      className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                      initial={false}
                      animate={{ width: active ? 20 : 0, opacity: active ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ boxShadow: active ? "0 0 12px rgba(168,85,247,0.5)" : "none" }}
                    />
                  </a>
                );
              })}
            </nav>

            {/* ── RIGHT: Controls ───────────────────────────────── */}
            <div className="flex items-center gap-2 ml-auto">

              {/* Language picker */}
              <div ref={langRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={langOpen ? "true" : "false"}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-[12px] font-medium text-white/35 transition-all duration-200 hover:border-white/12 hover:text-white/60"
                >
                  <span className="text-sm leading-none">{currentLang?.flag}</span>
                  <span className="hidden sm:inline">{currentLang?.label}</span>
                  <motion.span animate={{ rotate: langOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown className="h-2.5 w-2.5" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.14, ease: "easeOut" }}
                      className="absolute right-0 top-[calc(100%+8px)] w-[168px] rounded-xl border border-white/[0.08] bg-[#0B0B18]/98 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
                    >
                      {LANG_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setLanguage(opt.value); setLangOpen(false); }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                            opt.value === language
                              ? "bg-purple-500/10 text-white"
                              : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                          }`}
                        >
                          <span className="text-sm leading-none">{opt.flag}</span>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── AUTH SECTION ────────────────────────────────── */}
              {!isLoading && (
                <>
                  {/* ── LOGGED OUT ───────── */}
                  {!isLoggedIn && (
                    <div className="hidden md:flex items-center gap-2">
                      <Link href="/login">
                        <button
                          type="button"
                          className="h-8 rounded-lg border border-white/[0.08] bg-transparent px-4 text-[13px] font-medium text-white/50 transition-all duration-200 hover:border-white/15 hover:text-white/80"
                        >
                          {translate("nav.login")}
                        </button>
                      </Link>
                      <Link href="/register">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(168,85,247,0.35)" }}
                          whileTap={{ scale: 0.97 }}
                          className="h-8 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 text-[13px] font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all duration-200"
                        >
                          {translate("nav.register")}
                        </motion.button>
                      </Link>
                    </div>
                  )}

                  {/* ── LOGGED IN ────────── */}
                  {isLoggedIn && (
                    <div ref={accountRef} className="relative hidden md:block">
                      {/* Trigger button */}
                      <motion.button
                        type="button"
                        onClick={() => setAccountOpen((v) => !v)}
                        whileHover={{ borderColor: "rgba(168,85,247,0.25)" }}
                        className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 pr-3 text-[13px] font-medium text-white/70 transition-all duration-200 hover:bg-purple-500/[0.05]"
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-[10px] font-black text-white shadow-[0_0_12px_rgba(168,85,247,0.22)]">
                            {initials}
                          </div>
                          <OnlineDot size="sm" />
                          <span aria-hidden className="absolute -bottom-px -right-px block h-[7px] w-[7px] rounded-full border-[1.5px] border-[rgba(9,9,18,0.9)]" />
                        </div>
                        <span className="hidden lg:block max-w-[90px] truncate">{fullName}</span>
                        <motion.span animate={{ rotate: accountOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                          <ChevronDown className="h-3 w-3 text-white/25" />
                        </motion.span>
                      </motion.button>

                      {/* Account dropdown */}
                      <AnimatePresence>
                        {accountOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute right-0 top-[calc(100%+10px)] w-[248px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A0A17]/98 shadow-[0_24px_72px_rgba(0,0,0,0.60),0_0_0_1px_rgba(168,85,247,0.06)_inset] backdrop-blur-2xl"
                          >
                            {/* User header */}
                            <div className="relative px-4 py-4 border-b border-white/[0.05]">
                              {/* Purple gradient glow behind header */}
                              <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.07] to-transparent pointer-events-none" />
                              <div className="relative flex items-center gap-3">
                                {/* Large avatar */}
                                <div className="relative shrink-0">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-[13px] font-black text-white shadow-[0_0_20px_rgba(168,85,247,0.30)]">
                                    {initials}
                                  </div>
                                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-[2px] border-[#0A0A17] bg-transparent">
                                    <OnlineDot size="sm" />
                                  </span>
                                </div>
                                {/* Name + email + status */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-bold text-white truncate">{fullName}</p>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-[10px] font-semibold text-emerald-400/80">{translate("nav.online")}</span>
                                    </div>
                                  </div>
                                  {profile?.email && (
                                    <p className="text-[11px] text-white/25 truncate mt-0.5">{profile.email}</p>
                                  )}
                                  {(isAdmin || isModerator) && (
                                    <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                      isAdmin
                                        ? "bg-purple-500/15 text-purple-300/80 border border-purple-500/20"
                                        : "bg-blue-500/15 text-blue-300/80 border border-blue-500/20"
                                    }`}>
                                      {isAdmin ? translate("admin.role.admin") : translate("admin.role.moderator")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Menu items */}
                            <div className="p-1.5 space-y-0.5">
                              <DropItem
                                href="/account"
                                icon={User}
                                label={translate("nav.myProfile")}
                                onClick={() => setAccountOpen(false)}
                              />
                              <DropItem
                                href="/account"
                                icon={Receipt}
                                label={translate("nav.myOrders")}
                                onClick={() => setAccountOpen(false)}
                              />
                            </div>

                            {/* Staff items */}
                            {(isAdmin || isModerator) && (
                              <>
                                <div className="mx-3 h-px bg-white/[0.05]" />
                                <div className="p-1.5 space-y-0.5">
                                  {isAdmin && (
                                    <DropItem
                                      href="/admin"
                                      icon={LayoutDashboard}
                                      label={translate("nav.adminPanel")}
                                      accent="purple"
                                      onClick={() => setAccountOpen(false)}
                                    />
                                  )}
                                  {isModerator && (
                                    <DropItem
                                      href="/admin"
                                      icon={ShieldCheck}
                                      label={translate("nav.moderatorPanel")}
                                      accent="blue"
                                      onClick={() => setAccountOpen(false)}
                                    />
                                  )}
                                </div>
                              </>
                            )}

                            <div className="mx-3 h-px bg-white/[0.05]" />
                            <div className="p-1.5">
                              <button
                                type="button"
                                onClick={() => { setAccountOpen(false); setShowLogoutModal(true); }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/35 transition-all duration-150 hover:bg-red-500/10 hover:text-red-300/80"
                              >
                                <LogOut className="h-4 w-4 shrink-0" />
                                {translate("nav.logout")}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

              {/* Mobile hamburger */}
              <motion.button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                whileTap={{ scale: 0.93 }}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/40 transition-all hover:border-purple-500/20 hover:text-white/70"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="h-[15px] w-[15px]" />
                    </motion.span>
                  ) : (
                    <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="h-[15px] w-[15px]" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── MOBILE MENU ─────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#090912]/97 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-[40px]"
            >
              {/* Nav links */}
              <div className="space-y-0.5">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80"
                    >
                      <Icon className="h-4 w-4 text-purple-400/50 shrink-0" />
                      {translate(link.labelKey)}
                    </a>
                  );
                })}
              </div>

              <div className="my-2 mx-2 h-px bg-white/[0.05]" />

              {/* Auth section */}
              {!isLoading && (
                <div className="space-y-0.5">
                  {!isLoggedIn ? (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80">
                        <User className="h-4 w-4 text-white/25 shrink-0" />
                        {translate("nav.login")}
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-purple-300 transition-all hover:bg-purple-500/10">
                        <User className="h-4 w-4 shrink-0" />
                        {translate("nav.register")}
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* User info row */}
                      <div className="flex items-center gap-3 px-4 py-3 mb-1">
                        <div className="relative shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-[11px] font-black text-white shadow-[0_0_14px_rgba(168,85,247,0.28)]">
                            {initials}
                          </div>
                          <span className="absolute -bottom-px -right-px flex h-3 w-3 items-center justify-center rounded-full border-[2px] border-[#090912]">
                            <OnlineDot size="sm" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-white/80 truncate">{fullName}</p>
                          {profile?.email && (
                            <p className="text-[11px] text-white/25 truncate">{profile.email}</p>
                          )}
                        </div>
                      </div>

                      <Link href="/account" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80">
                        <User className="h-4 w-4 text-white/20 shrink-0" />
                        {translate("nav.myProfile")}
                      </Link>

                      <Link href="/account" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80">
                        <Receipt className="h-4 w-4 text-white/20 shrink-0" />
                        {translate("nav.myOrders")}
                      </Link>

                      {isAdmin && (
                        <Link href="/admin" onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-purple-300/70 transition-all hover:bg-purple-500/10 hover:text-purple-200">
                          <LayoutDashboard className="h-4 w-4 text-purple-400/60 shrink-0" />
                          {translate("nav.adminPanel")}
                        </Link>
                      )}

                      {isModerator && (
                        <Link href="/admin" onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-blue-300/70 transition-all hover:bg-blue-500/10 hover:text-blue-200">
                          <ShieldCheck className="h-4 w-4 text-blue-400/60 shrink-0" />
                          {translate("nav.moderatorPanel")}
                        </Link>
                      )}

                      <div className="mx-2 my-1 h-px bg-white/[0.05]" />

                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); setShowLogoutModal(true); }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white/35 transition-all hover:bg-red-500/10 hover:text-red-300/80"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {translate("nav.logout")}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="my-2 mx-2 h-px bg-white/[0.05]" />

              {/* Language switcher */}
              <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setLanguage(opt.value); setMobileOpen(false); }}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      opt.value === language
                        ? "border-purple-500/25 bg-purple-500/10 text-white/80"
                        : "border-white/[0.07] text-white/30 hover:border-white/12 hover:text-white/55"
                    }`}
                  >
                    {opt.flag} {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spacer — prevents content from sitting under the fixed navbar */}
      <div className="h-[72px]" />

      <ConfirmModal
        open={showLogoutModal}
        title={translate("nav.signOutConfirmTitle")}
        message={translate("nav.signOutConfirmMsg")}
        confirmLabel={translate("nav.signOutConfirmLabel")}
        variant="default"
        loading={isSigningOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}

/* ── Dropdown item ─────────────────────────────────────────────── */
function DropItem({
  href,
  icon: Icon,
  label,
  accent,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  accent?: "purple" | "blue";
  onClick?: () => void;
}) {
  const color = accent === "purple"
    ? "text-purple-300/70 hover:bg-purple-500/10 hover:text-purple-200"
    : accent === "blue"
    ? "text-blue-300/70 hover:bg-blue-500/10 hover:text-blue-200"
    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80";

  const iconColor = accent === "purple"
    ? "text-purple-400/60"
    : accent === "blue"
    ? "text-blue-400/60"
    : "text-white/20";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${color}`}
    >
      <Icon className={`h-[15px] w-[15px] shrink-0 ${iconColor}`} />
      {label}
    </Link>
  );
}
