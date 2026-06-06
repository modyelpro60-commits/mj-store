"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import ConfirmModal from "../ConfirmModal";

export default function StorefrontNavbar() {
  const router = useRouter();
  const { role, isLoading, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navRole = role;

  const isUserLikeRole =
    navRole === "user" || navRole === "customer" || navRole === "helper";
  const isStaff = navRole === "admin" || navRole === "moderator";

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

  // Close mobile menu on navigation
  useEffect(() => {
    const handler = () => setMobileMenuOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const desktopNavLinks = (
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
  );

  const authButtons = (isMobile: boolean) => {
    const btnClass = isMobile
      ? "w-full text-center rounded-2xl border px-5 py-3 font-semibold transition"
      : "";

    if (!isLoading && !navRole) {
      return (
        <>
          <Link href="/login" className={isMobile ? "w-full" : ""}>
            <motion.button
              whileHover={{ boxShadow: isMobile ? "none" : "0 0 35px rgba(168,85,247,0.16)" }}
              className={`border border-purple-500/30 hover:border-purple-500 px-5 py-3 rounded-xl font-semibold text-zinc-100 w-full ${btnClass}`}
            >
              {translate("nav.login")}
            </motion.button>
          </Link>
          <Link href="/register" className={isMobile ? "w-full" : ""}>
            <motion.button
              whileHover={{ boxShadow: isMobile ? "none" : "0 0 35px rgba(168,85,247,0.16)" }}
              className={`bg-purple-600/20 hover:bg-purple-600/30 px-5 py-3 rounded-xl font-semibold text-white border border-purple-500/30 w-full ${btnClass}`}
            >
              {translate("nav.register")}
            </motion.button>
          </Link>
        </>
      );
    }

    if (!isLoading && (isUserLikeRole || isStaff)) {
      return (
        <>
          <Link href="/account" className={isMobile ? "w-full" : ""}>
            <motion.button
              whileHover={{ boxShadow: isMobile ? "none" : "0 0 35px rgba(168,85,247,0.16)" }}
              className={`bg-purple-600/20 hover:bg-purple-600/30 px-5 py-3 rounded-xl font-semibold text-white border border-purple-500/30 w-full ${btnClass}`}
            >
              {translate("nav.account")}
            </motion.button>
          </Link>

          {isStaff ? (
            <Link href="/admin" className={isMobile ? "w-full" : ""}>
              <motion.button
                whileHover={{ boxShadow: isMobile ? "none" : "0 0 40px rgba(168,85,247,0.25)", y: isMobile ? 0 : -2 }}
                className={`bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-6 py-3 rounded-xl font-black text-white border border-purple-400/30 w-full ${btnClass}`}
              >
                {translate("nav.admin")}
              </motion.button>
            </Link>
          ) : null}

          <motion.button
            whileHover={{ boxShadow: isMobile ? "none" : "0 0 35px rgba(168,85,247,0.16)" }}
            onClick={() => setShowLogoutModal(true)}
            disabled={isSigningOut}
            aria-busy={isSigningOut}
            className={`border border-purple-500/30 hover:border-purple-500 px-5 py-3 rounded-xl font-semibold text-zinc-100 disabled:opacity-60 w-full ${btnClass}`}
          >
            {isSigningOut ? translate("auth.signingOut") : translate("nav.logout")}
          </motion.button>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-purple-500/20 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6 flex items-center justify-between">
          {/* Logo */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[6px] md:tracking-[8px] drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]">
              MJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400">STORE</span>
            </h1>
          </div>

          {desktopNavLinks}

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-6">
            {/* Language selector */}
            <div ref={langRef} className="relative">
              <motion.button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={langOpen}
                whileHover={{
                  boxShadow: "0 0 0 1px rgba(168,85,247,0.32), 0 0 40px rgba(168,85,247,0.2)",
                  borderColor: "rgba(168,85,247,0.5)"
                }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="border border-purple-500/30 hover:border-purple-500/50 px-4 py-2.5 md:px-5 md:py-3 rounded-xl transition flex items-center gap-2 bg-black/30 backdrop-blur-sm font-semibold text-sm"
              >
                <span className="text-zinc-100">
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
                className="absolute right-0 mt-3 w-[200px] rounded-[18px] border border-purple-500/30 bg-black/85 backdrop-blur-xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden z-50"
              >
                <div className="py-3">
                  {langOptions.map((opt) => {
                    const active = opt.value === language;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        role="menuitem"
                        whileHover={{ boxShadow: "0 0 0 1px rgba(168,85,247,0.28), 0 0 30px rgba(168,85,247,0.16)" }}
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
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl font-black tracking-wide transition shadow-[0_0_40px_rgba(168,85,247,0.25)] border border-purple-400/30 text-sm md:text-base"
              >
                {translate("nav.buyNow")}
              </motion.button>
            </a>

            {authButtons(false)}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-12 w-12 rounded-2xl border border-purple-500/30 bg-black/30 text-purple-200"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-purple-500/15"
            >
              <div className="px-4 py-6 space-y-4 bg-black/60 backdrop-blur-xl">
                {/* Nav links */}
                <div className="flex flex-col gap-3 text-zinc-300 font-semibold text-lg">
                  <a
                    href="#products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 hover:bg-white/10 transition"
                  >
                    {translate("nav.products")}
                  </a>
                  <a
                    href="#reviews"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 hover:bg-white/10 transition"
                  >
                    {translate("nav.reviews")}
                  </a>
                  <a
                    href="#contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 hover:bg-white/10 transition"
                  >
                    {translate("nav.contact")}
                  </a>
                </div>

                {/* Language selector (mobile) */}
                <div className="flex flex-wrap gap-2">
                  {langOptions.map((opt) => {
                    const active = opt.value === language;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setLanguage(opt.value);
                          setLangOpen(false);
                        }}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-purple-500/40 bg-purple-500/15 text-white"
                            : "border-white/10 bg-white/5 text-zinc-300"
                        }`}
                      >
                        {opt.flag} {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Buy Now (mobile) */}
                <a href="#products" onClick={() => setMobileMenuOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl px-5 py-4 font-black tracking-wide text-white border border-purple-400/30"
                  >
                    {translate("nav.buyNow")}
                  </motion.button>
                </a>

                {/* Auth buttons (mobile) */}
                <div className="flex flex-col gap-3">
                  {authButtons(true)}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>

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