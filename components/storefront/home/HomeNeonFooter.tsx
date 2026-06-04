"use client";

import { motion } from "framer-motion";
import MJLogo from "../../../components/branding/MJLogo";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";

const social = [
  { key: "x", label: "X", href: "#", tone: "purple" as const },
  { key: "ig", label: "IG", href: "#", tone: "blue" as const },
  { key: "fb", label: "FB", href: "#", tone: "purple" as const },
  { key: "gh", label: "GH", href: "#", tone: "blue" as const },
] as const;

function toneClasses(tone: (typeof social)[number]["tone"]) {
  if (tone === "blue") {
    return {
      border: "border-sky-500/25",
      bg: "bg-sky-500/10",
      ring: "shadow-[0_0_40px_rgba(59,130,246,0.20)]",
      text: "text-sky-200",
    };
  }
  return {
    border: "border-purple-500/25",
    bg: "bg-purple-500/10",
    ring: "shadow-[0_0_40px_rgba(168,85,247,0.20)]",
    text: "text-purple-200",
  };
}

export default function HomeNeonFooter() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  return (
    <footer id="contact" className="mt-10 border-t border-purple-500/10 bg-black/20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <MJLogo size="md" glow />
              <div className="text-sm text-zinc-400 leading-relaxed">
                {isArabic
                  ? "متجر اشتراكات رقمية أصلية — وصول سريع وتجربة آمنة."
                  : "Premium digital subscriptions — fast access and a secure checkout."}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6">
              <div className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                Payment methods
              </div>
              <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                {["Visa", "Mastercard", "Mada", "Apple Pay"].map((p) => (
                  <div
                    key={p}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-zinc-200"
                  >
                    {p}
                  </div>
                ))}
              </div>
              <div className="mt-3 sm:mt-4 text-sm text-zinc-500">
                {isArabic
                  ? "معالجة دفع محمية • تأكيد فوري بعد الدفع"
                  : "Protected payment processing • Instant unlock after checkout"}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="grid gap-6 sm:gap-8 grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                  Links
                </div>
                <div className="mt-4 flex flex-col gap-3 text-zinc-300 font-medium">
                  <a href="#catalog" className="hover:text-white transition">
                    {isArabic ? "الكتالوج" : "Catalog"}
                  </a>
                  <a href="#products" className="hover:text-white transition">
                    {isArabic ? "المنتجات" : "Products"}
                  </a>
                  <a href="#featured" className="hover:text-white transition">
                    {isArabic ? "مميزة" : "Featured"}
                  </a>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                  Support
                </div>
                <div className="mt-4 flex flex-col gap-3 text-zinc-300 font-medium">
                  <a href="#contact" className="hover:text-white transition">
                    {isArabic ? "الدعم" : "Contact"}
                  </a>
                  <a href="/account" className="hover:text-white transition">
                    {isArabic ? "حسابي" : "My Account"}
                  </a>
                  <a href="/checkout" className="hover:text-white transition">
                    {isArabic ? "الدفع" : "Checkout"}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6">
              <div className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                Social
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                {social.map((s) => {
                  const c = toneClasses(s.tone);
                  return (
                    <a
                      key={s.key}
                      href={s.href}
                      className={[
                        "inline-flex items-center justify-center h-11 w-11 rounded-2xl border bg-black/20 text-sm font-bold transition",
                        c.border,
                        c.bg,
                        c.text,
                        c.ring,
                      ].join(" ")}
                      aria-label={s.label}
                    >
                      {s.label}
                    </a>
                  );
                })}
              </div>

              <div className="mt-6 text-sm text-zinc-500">
                {isArabic
                  ? "© 2026 MJ STORE — جميع الحقوق محفوظة."
                  : "© 2026 MJ STORE — All rights reserved."}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
