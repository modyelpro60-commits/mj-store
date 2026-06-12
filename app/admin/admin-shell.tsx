"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ChevronRight,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";
import { useChatUnread } from "../../components/chat/useChatUnread";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { MJMark } from "../../components/brand/MJLogo";
import UserAvatar from "../../components/ui/UserAvatar";

const NAV_ITEMS = [
  { href: "/",                labelKey: "admin.nav.home"       as const, icon: Home,          adminOnly: true,  ownerOnly: false },
  { href: "/admin",           labelKey: "admin.nav.overview"   as const, icon: LayoutDashboard, adminOnly: true, ownerOnly: false },
  { href: "/admin/products",  labelKey: "admin.nav.products"   as const, icon: Boxes,          adminOnly: false, ownerOnly: false },
  { href: "/admin/orders",    labelKey: "admin.nav.orders"     as const, icon: ShoppingCart,   adminOnly: false, ownerOnly: false },
  { href: "/admin/chat",      labelKey: "admin.nav.chat"       as const, icon: MessageCircle,  adminOnly: false, ownerOnly: false },
  { href: "/admin/logs",      labelKey: "admin.nav.logs"       as const, icon: ScrollText,     adminOnly: true,  ownerOnly: false },
  { href: "/admin/analytics", labelKey: "admin.nav.analytics"  as const, icon: TrendingUp,     adminOnly: true,  ownerOnly: false },
  { href: "/admin/users",     labelKey: "admin.nav.users"      as const, icon: Users,          adminOnly: true,  ownerOnly: false },
  { href: "/admin/settings",  labelKey: "admin.nav.settings"   as const, icon: CreditCard,     adminOnly: true,  ownerOnly: false },
  { href: "/admin/roles",     labelKey: "admin.nav.roles"      as const, icon: ShieldCheck,    adminOnly: true,  ownerOnly: true  },
] as const;

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, profile, isLoading, signOut, accessToken, can } = useAuth();
  const { translate } = useLanguage();
  const chatUnread = useChatUnread(accessToken, !!accessToken);

  const isOwner = role === "owner";
  const isAdminOrOwner = role === "admin" || role === "owner";

  /* Show all items while loading (prevents layout flicker).
     Once role is known:
       owner     → sees everything
       admin     → sees everything except ownerOnly items
       moderator → sees only !adminOnly items */
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (isLoading) return true;
    if (item.ownerOnly) return isOwner || can("manage_roles");
    if (item.adminOnly) return isAdminOrOwner;
    return true;
  });

  const currentLabel = visibleItems.find((item) => item.href === pathname)?.labelKey;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] text-white">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.12),_transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(168,85,247,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.2)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-[-10%] top-[-15%] h-[32rem] w-[32rem] rounded-full bg-purple-700/15 blur-[160px]" />
        <div className="absolute right-[-12%] top-[20%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/8 blur-[140px]" />
        <div className="absolute bottom-[-18%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-violet-500/8 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1720px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:px-6 lg:py-5">

        {/* ── Mobile bottom nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-purple-500/15 bg-[#050507]/95 px-1 py-1.5 backdrop-blur-xl lg:hidden">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[9px] font-semibold transition-all duration-200 min-w-0 ${
                  active ? "text-purple-200" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span className={`relative grid h-7 w-7 place-items-center rounded-lg transition-all duration-200 ${
                  active ? "bg-purple-500/25 text-purple-200" : "text-zinc-500"
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.href === "/admin/chat" && chatUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full border border-[#050507] bg-red-500 grid place-items-center text-[8px] font-black text-white">
                      {chatUnread > 9 ? "9+" : chatUnread}
                    </span>
                  )}
                </span>
                <span className="hidden sm:block">{translate(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex lg:flex-col rounded-[2rem] border border-white/[0.08] bg-zinc-950/85 p-4 shadow-[0_0_0_1px_rgba(168,85,247,0.05),0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[264px] lg:shrink-0">

          {/* Logo */}
          <div className="flex items-center gap-3 rounded-[1.5rem] border border-purple-500/15 bg-purple-500/[0.06] px-4 py-3.5">
            <MJMark size={44} glow />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-purple-300/60">MJ Store</p>
              <p className="text-base font-black tracking-tight">{translate("admin.title")}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="mt-5 flex-1 space-y-1">
            {visibleItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "border-purple-400/30 bg-purple-500/15 text-white shadow-[0_0_24px_rgba(168,85,247,0.18)]"
                      : "border-transparent text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-purple-400" />
                  )}
                  <span className={`relative grid h-9 w-9 place-items-center rounded-xl transition-all duration-300 ${
                    active
                      ? "bg-purple-500/25 text-purple-200"
                      : "bg-white/[0.04] text-zinc-500 group-hover:bg-purple-500/10 group-hover:text-purple-300"
                  }`}>
                    <Icon className="h-4 w-4" />
                    {item.href === "/admin/chat" && chatUnread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full border-2 border-zinc-950 bg-red-500 grid place-items-center text-[9px] font-black text-white">
                        {chatUnread > 9 ? "9+" : chatUnread}
                      </span>
                    )}
                  </span>
                  {translate(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* User card */}
          {profile ? (
            <div className="mt-4 rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-3">
                <UserAvatar role={role} verified={profile?.verified} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {profile.full_name ?? profile.email ?? "Admin"}
                  </p>
                  <p className="truncate text-xs text-zinc-600">{profile.email}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                {role === "owner" ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-100"
                    style={{
                      borderColor: "rgba(245,158,11,0.45)",
                      background: "linear-gradient(90deg, rgba(245,158,11,0.20) 0%, rgba(251,191,36,0.28) 50%, rgba(245,158,11,0.20) 100%)",
                      backgroundSize: "200% auto",
                      animation: "mj-owner-shimmer 3.5s linear infinite",
                    }}
                  >
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {translate("admin.role.owner")}
                  </span>
                ) : (
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    role === "admin"
                      ? "border-purple-400/25 bg-purple-500/15 text-purple-200"
                      : role === "moderator"
                      ? "border-blue-400/25 bg-blue-500/10 text-blue-200"
                      : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                  }`}>
                    {role === "admin"
                      ? translate("admin.role.admin")
                      : role === "helper"
                      ? translate("admin.role.helper")
                      : translate("admin.role.moderator")}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => { void signOut(); }}
                  className="flex items-center gap-1.5 rounded-xl border border-transparent px-2.5 py-1.5 text-xs font-semibold text-zinc-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {translate("nav.logout")}
                </button>
              </div>
            </div>
          ) : null}

        </aside>

        {/* ── Content area ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 pb-20 lg:pb-0">

          {/* Header */}
          <header className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-white/[0.08] bg-zinc-950/80 px-5 py-3.5 backdrop-blur-xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-zinc-600">MJ Store</span>
              <ChevronRight className="h-4 w-4 text-zinc-800" />
              <span className="font-bold text-white">
                {currentLabel ? translate(currentLabel) : translate("admin.nav.overview")}
              </span>
            </div>

            {/* Nav pills (desktop) */}
            <div className="hidden flex-wrap gap-2 xl:flex">
              {visibleItems.filter((item) => item.href !== "/").map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                      active
                        ? "border-purple-400/35 bg-purple-500/15 text-white"
                        : "border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-purple-500/20 hover:text-zinc-300"
                    }`}
                  >
                    {translate(item.labelKey)}
                    {item.href === "/admin/chat" && chatUnread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full border-2 border-zinc-950 bg-red-500 grid place-items-center text-[9px] font-black text-white">
                        {chatUnread > 9 ? "9+" : chatUnread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </header>

          {/* Page */}
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="min-w-0 flex-1"
            >
              {children}
            </motion.main>
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
