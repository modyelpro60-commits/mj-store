"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: Boxes,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart,
  },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.16),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_20%)]" />
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage: `linear-gradient(rgba(168,85,247,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.18) 1px, transparent 1px)`,
            backgroundSize: "72px 72px",
          }}
        />
        <div className="absolute left-[-10%] top-[-15%] h-[32rem] w-[32rem] rounded-full bg-purple-700/20 blur-[160px]" />
        <div className="absolute right-[-12%] top-[18%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute bottom-[-18%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1720px] flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8 lg:py-6">
        <aside className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_0_0_1px_rgba(168,85,247,0.06),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[280px] lg:flex-shrink-0 lg:p-5">
          <div className="flex items-center gap-3 rounded-[1.5rem] border border-purple-500/15 bg-white/5 px-4 py-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-400/30 bg-purple-500/15 text-purple-200 shadow-[0_0_30px_rgba(168,85,247,0.25)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-purple-300/70">
                MJ Store
              </p>
              <h1 className="text-lg font-black tracking-tight">Admin Console</h1>
            </div>
          </div>

          <nav className="mt-6 space-y-2 lg:space-y-3">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
                    active
                      ? "border-purple-400/35 bg-purple-500/15 text-white shadow-[0_0_30px_rgba(168,85,247,0.22)]"
                      : "border-transparent bg-white/0 text-zinc-400 hover:border-purple-500/20 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-2xl transition-all duration-300 ${
                      active
                        ? "bg-purple-500/20 text-purple-200"
                        : "bg-white/5 text-zinc-300 group-hover:bg-purple-500/10 group-hover:text-purple-200"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[1.5rem] border border-purple-500/15 bg-gradient-to-br from-purple-500/10 via-white/5 to-transparent p-4">
            <div className="flex items-center gap-3 text-purple-200">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.22em]">
                Live Activity
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Premium admin layout, dark mode hierarchy, and neon motion polish across all
              dashboard screens.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="rounded-[2rem] border border-white/10 bg-zinc-950/70 px-5 py-4 shadow-[0_0_0_1px_rgba(168,85,247,0.04),0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-purple-300/70">
                  Premium Gaming SaaS
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  MJ Store Admin Dashboard
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {navItems.map((item) => {
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                        active
                          ? "border-purple-400/40 bg-purple-500/15 text-white shadow-[0_0_20px_rgba(168,85,247,0.22)]"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:border-purple-500/25 hover:bg-purple-500/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(10px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
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
