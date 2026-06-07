"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { useAuth } from "../auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import ConfirmModal from "../ConfirmModal";

/* ── Config ─────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "/#products", labelKey: "nav.products" as const, icon: Package       },
  { href: "/#reviews",  labelKey: "nav.reviews"  as const, icon: MessageSquare },
  { href: "/#contact",  labelKey: "nav.contact"  as const, icon: ShoppingBag   },
] as const;

const LANG_OPTIONS = [
  { value: "en", flag: "🇬🇧", label: "English"  },
  { value: "ar", flag: "🇪🇬", label: "العربية"  },
  { value: "fr", flag: "🇫🇷", label: "Français" },
] as const;

/* ── Online status dot ──────────────────────────────────────────── */
function OnlineDot() {
  return (
    <span className="relative inline-flex h-[7px] w-[7px] shrink-0">
      <span className="absolute inset-0 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]" />
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-emerald-400"
        animate={{ scale: [1, 2.2, 1], opacity: [0.55, 0, 0.55] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

/* ── Dropdown menu item ─────────────────────────────────────────── */
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
  const row =
    accent === "purple"
      ? "text-purple-300/75 hover:bg-purple-500/10 hover:text-purple-200"
      : accent === "blue"
      ? "text-blue-300/75 hover:bg-blue-500/10 hover:text-blue-200"
      : "text-white/45 hover:bg-white/[0.05] hover:text-white/80";
  const ico =
    accent === "purple"
      ? "text-purple-400/60"
      : accent === "blue"
      ? "text-blue-400/60"
      : "text-white/20";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${row}`}
    >
      <Icon className={`h-[15px] w-[15px] shrink-0 ${ico}`} />
      {label}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  COMMAND BAR — Premium Storefront Navbar
 * ══════════════════════════════════════════════════════════════════ */

export default function CommandBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { role, isLoading, signOut, profile } = useAuth();
  const { language, setLanguage, translate }   = useLanguage();

  /* ── State ──────────────────────────────────────────────────── */
  const [scrolled,       setScrolled]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [accountOpen,    setAccountOpen]    = useState(false);
  const [langOpen,       setLangOpen]       = useState(false);
  const [showLogout,     setShowLogout]     = useState(false);
  const [isSigningOut,   setIsSigningOut]   = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);

  /* ── Derived user info ──────────────────────────────────────── */
  const isAdmin     = role === "admin";
  const isModerator = role === "moderator";
  const isLoggedIn  = !!role && !isLoading;

  const fullName    = profile?.full_name || profile?.email || "User";
  const initials    = fullName.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);
  const currentLang = LANG_OPTIONS.find((o) => o.value === language) ?? LANG_OPTIONS[0];

  /* ── Scroll detection ───────────────────────────────────────── */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* ── Close mobile on route change ───────────────────────────── */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* ── Click outside to close dropdowns ──────────────────────── */
  const handleOutside = useCallback((e: MouseEvent) => {
    const t = e.target as Node | null;
    if (!t) return;
    if (!langRef.current?.contains(t))    setLangOpen(false);
    if (!accountRef.current?.contains(t)) setAccountOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [handleOutside]);

  /* ── Logout ─────────────────────────────────────────────────── */
  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      toast.success(translate("toast.signedOutTitle"), { description: translate("toast.signedOutMessage") });
      await new Promise((r) => setTimeout(r, 800));
      router.refresh();
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate("toast.logoutFailedTitle"));
    } finally {
      setIsSigningOut(false);
      setShowLogout(false);
    }
  }

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <>
      {/* ── FLOATING CAPSULE ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-28px)] max-w-[1300px]"
      >
        <div
          className={`relative h-[58px] rounded-2xl border border-white/[0.07] transition-all duration-500 ${
            scrolled
              ? "bg-[rgba(6,6,14,0.92)] backdrop-blur-[44px] shadow-[0_8px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(168,85,247,0.09)_inset]"
              : "bg-[rgba(8,8,18,0.78)] backdrop-blur-[36px] shadow-[0_4px_32px_rgba(0,0,0,0.40),0_0_0_1px_rgba(168,85,247,0.05)_inset]"
          }`}
        >
          {/* Top highlight shimmer */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/18 to-transparent"
          />

          <div className="flex h-full items-center gap-4 px-4 md:px-6">

            {/* ── LOGO ────────────────────────────────────────── */}
            <Link href="/" className="group flex items-center gap-2.5 shrink-0">
              <div className="relative flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-[0_0_18px_rgba(168,85,247,0.30)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.55)] group-hover:scale-[1.06]">
                <span className="text-[13px] font-black text-white tracking-tighter select-none">M</span>
              </div>
              <span className="hidden sm:block text-[13px] font-black tracking-[0.28em] text-white">
                MJ{" "}
                <span className="bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
                  STORE
                </span>
              </span>
            </Link>

            {/* ── CENTER: Nav links ────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map((link) => {
                const Icon   = link.icon;
                const active = link.href === "/#products"
                  ? (pathname === "/" || pathname.startsWith("/product"))
                  : false;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`group relative flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 ${
                      active ? "text-white" : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    <Icon className={`h-[13px] w-[13px] transition-colors duration-200 ${
                      active ? "text-purple-400" : "text-white/20 group-hover:text-purple-400/60"
                    }`} />
                    {translate(link.labelKey)}
                    <motion.span
                      aria-hidden
                      className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                      initial={false}
                      animate={{ width: active ? 20 : 0, opacity: active ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ boxShadow: active ? "0 0 12px rgba(168,85,247,0.55)" : "none" }}
                    />
                  </a>
                );
              })}
            </nav>

            {/* ── RIGHT ───────────────────────────────────────── */}
            <div className="flex items-center gap-2 ml-auto">

              {/* Language picker */}
              <div ref={langRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  aria-haspopup="menu"
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-[11px] font-medium text-white/30 transition-all duration-200 hover:border-white/10 hover:text-white/55"
                >
                  <span className="text-sm leading-none">{currentLang.flag}</span>
                  <span className="hidden sm:inline">{currentLang.label}</span>
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
                      className="absolute right-0 top-[calc(100%+8px)] w-[164px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0B18]/98 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
                    >
                      {LANG_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setLanguage(opt.value); setLangOpen(false); }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                            opt.value === language
                              ? "bg-purple-500/12 text-white"
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

              {/* ── AUTH ──────────────────────────────────────── */}
              {!isLoading && (
                <>
                  {/* Logged out */}
                  {!isLoggedIn && (
                    <div className="hidden md:flex items-center gap-2">
                      <Link href="/login">
                        <button
                          type="button"
                          className="h-8 rounded-lg border border-white/[0.07] bg-transparent px-4 text-[13px] font-medium text-white/45 transition-all duration-200 hover:border-white/12 hover:text-white/75"
                        >
                          {translate("nav.login")}
                        </button>
                      </Link>
                      <Link href="/register">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(168,85,247,0.40)" }}
                          whileTap={{ scale: 0.97 }}
                          className="h-8 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 text-[13px] font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all duration-200"
                        >
                          {translate("nav.register")}
                        </motion.button>
                      </Link>
                    </div>
                  )}

                  {/* Logged in — account button + dropdown */}
                  {isLoggedIn && (
                    <div ref={accountRef} className="relative hidden md:block">
                      <motion.button
                        type="button"
                        onClick={() => setAccountOpen((v) => !v)}
                        whileHover={{ borderColor: "rgba(168,85,247,0.28)" }}
                        className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 pr-3 text-[13px] font-medium text-white/65 transition-all duration-200 hover:bg-purple-500/[0.06]"
                      >
                        {/* Avatar + online dot */}
                        <div className="relative shrink-0">
                          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-[9px] font-black text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                            {initials}
                          </div>
                          <span className="absolute -bottom-px -right-px flex h-[9px] w-[9px] items-center justify-center rounded-full border-[1.5px] border-[rgba(8,8,18,0.95)] bg-[#08081A]">
                            <OnlineDot />
                          </span>
                        </div>
                        <span className="hidden lg:block max-w-[84px] truncate">{fullName}</span>
                        <motion.span animate={{ rotate: accountOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                          <ChevronDown className="h-3 w-3 text-white/22" />
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
                            className="absolute right-0 top-[calc(100%+10px)] w-[252px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09091A]/98 shadow-[0_24px_72px_rgba(0,0,0,0.65),0_0_0_1px_rgba(168,85,247,0.07)_inset] backdrop-blur-2xl"
                          >
                            {/* User header */}
                            <div className="relative px-4 py-4 border-b border-white/[0.05]">
                              <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.08] to-transparent pointer-events-none" />
                              <div className="relative flex items-center gap-3">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-[13px] font-black text-white shadow-[0_0_22px_rgba(168,85,247,0.35)]">
                                    {initials}
                                  </div>
                                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[2px] border-[#09091A] bg-[#09091A]">
                                    <OnlineDot />
                                  </span>
                                </div>
                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[13px] font-bold text-white truncate">{fullName}</p>
                                    <span className="text-[10px] font-semibold text-emerald-400/75 shrink-0">● Online</span>
                                  </div>
                                  {profile?.email && (
                                    <p className="text-[11px] text-white/22 truncate mt-0.5">{profile.email}</p>
                                  )}
                                  {(isAdmin || isModerator) && (
                                    <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                      isAdmin
                                        ? "bg-purple-500/15 text-purple-300/75 border-purple-500/20"
                                        : "bg-blue-500/15 text-blue-300/75 border-blue-500/20"
                                    }`}>
                                      {isAdmin ? "Admin" : "Moderator"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Core items */}
                            <div className="p-1.5 space-y-0.5">
                              <DropItem href="/account" icon={User}    label={translate("nav.account")} onClick={() => setAccountOpen(false)} />
                              <DropItem href="/account" icon={Receipt} label={translate("account.orders")} onClick={() => setAccountOpen(false)} />
                            </div>

                            {/* Staff items */}
                            {(isAdmin || isModerator) && (
                              <>
                                <div className="mx-3 h-px bg-white/[0.05]" />
                                <div className="p-1.5 space-y-0.5">
                                  {isAdmin && (
                                    <DropItem href="/admin" icon={LayoutDashboard} label={translate("account.adminPanel")} accent="purple" onClick={() => setAccountOpen(false)} />
                                  )}
                                  {isModerator && (
                                    <DropItem href="/admin" icon={ShieldCheck} label="Moderator Panel" accent="blue" onClick={() => setAccountOpen(false)} />
                                  )}
                                </div>
                              </>
                            )}

                            <div className="mx-3 h-px bg-white/[0.05]" />
                            <div className="p-1.5">
                              <button
                                type="button"
                                onClick={() => { setAccountOpen(false); setShowLogout(true); }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/32 transition-all duration-150 hover:bg-red-500/10 hover:text-red-300/80"
                              >
                                <LogOut className="h-[15px] w-[15px] shrink-0" />
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
                whileTap={{ scale: 0.9 }}
                aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/35 transition-all hover:border-purple-500/20 hover:text-white/65"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
                      <X className="h-[14px] w-[14px]" />
                    </motion.span>
                  ) : (
                    <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
                      <Menu className="h-[14px] w-[14px]" />
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
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08081A]/97 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.58)] backdrop-blur-[40px]"
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
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-white/45 transition-all hover:bg-white/[0.04] hover:text-white/80"
                    >
                      <Icon className="h-4 w-4 text-purple-400/40 shrink-0" />
                      {translate(link.labelKey)}
                    </a>
                  );
                })}
              </div>

              <div className="my-2 mx-2 h-px bg-white/[0.05]" />

              {/* Auth */}
              {!isLoading && (
                <div className="space-y-0.5">
                  {!isLoggedIn ? (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-white/45 transition-all hover:bg-white/[0.04] hover:text-white/80">
                        <User className="h-4 w-4 text-white/20 shrink-0" />
                        {translate("nav.login")}
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-purple-300/75 transition-all hover:bg-purple-500/10 hover:text-purple-200">
                        <User className="h-4 w-4 text-purple-400/50 shrink-0" />
                        {translate("nav.register")}
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* User info */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="relative shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-[11px] font-black text-white shadow-[0_0_16px_rgba(168,85,247,0.30)]">
                            {initials}
                          </div>
                          <span className="absolute -bottom-px -right-px flex h-3.5 w-3.5 items-center justify-center rounded-full border-[2px] border-[#08081A] bg-[#08081A]">
                            <OnlineDot />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-white/80 truncate">{fullName}</p>
                          {profile?.email && (
                            <p className="text-[11px] text-white/22 truncate">{profile.email}</p>
                          )}
                        </div>
                      </div>

                      <Link href="/account" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white/45 transition-all hover:bg-white/[0.04] hover:text-white/80">
                        <User className="h-4 w-4 text-white/18 shrink-0" />
                        {translate("nav.account")}
                      </Link>
                      <Link href="/account" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white/45 transition-all hover:bg-white/[0.04] hover:text-white/80">
                        <Receipt className="h-4 w-4 text-white/18 shrink-0" />
                        {translate("account.orders")}
                      </Link>

                      {isAdmin && (
                        <Link href="/admin" onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-purple-300/70 transition-all hover:bg-purple-500/10 hover:text-purple-200">
                          <LayoutDashboard className="h-4 w-4 text-purple-400/50 shrink-0" />
                          {translate("account.adminPanel")}
                        </Link>
                      )}
                      {isModerator && (
                        <Link href="/admin" onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-blue-300/70 transition-all hover:bg-blue-500/10 hover:text-blue-200">
                          <ShieldCheck className="h-4 w-4 text-blue-400/50 shrink-0" />
                          Moderator Panel
                        </Link>
                      )}

                      <div className="mx-2 my-1.5 h-px bg-white/[0.05]" />

                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); setShowLogout(true); }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white/32 transition-all hover:bg-red-500/10 hover:text-red-300/80"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {translate("nav.logout")}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Language */}
              <div className="my-2 mx-2 h-px bg-white/[0.05]" />
              <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setLanguage(opt.value); setMobileOpen(false); }}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      opt.value === language
                        ? "border-purple-500/25 bg-purple-500/10 text-white/75"
                        : "border-white/[0.07] text-white/28 hover:border-white/12 hover:text-white/55"
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

      {/* Spacer */}
      <div className="h-[72px]" aria-hidden />

      <ConfirmModal
        open={showLogout}
        title={translate("auth.logout")}
        message="Are you sure you want to sign out?"
        confirmLabel={translate("nav.logout")}
        variant="default"
        loading={isSigningOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}
