"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

/* Geometric MJ logo mark — purple identity */
function FooterMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden>
      <polygon points="0,0 19,0 28,9 28,28 0,28" fill="#09091A" stroke="#3b0764" strokeWidth="1" />
      <line x1="19" y1="0" x2="28" y2="9" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M5 20 L5 10 L14 17 L23 10 L23 20" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function HomeFooter() {
  const { translate } = useLanguage();

  const quickLinks = [
    { href: "#products", label: translate("home.quickLinks.products") },
    { href: "#reviews",  label: translate("home.quickLinks.reviews") },
    { href: "#contact",  label: translate("home.quickLinks.contact") },
  ];

  const supportLinks = [
    { href: "#", label: "Help Center" },
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
  ];

  return (
    <footer
      id="contact"
      className="relative bg-gradient-to-t from-black/60 to-black/20 backdrop-blur-xl"
    >
      {/* Animated border — very subtle shimmer sweeps across the top edge */}
      <div className="relative h-px overflow-hidden">
        <div className="absolute inset-0 bg-purple-500/20" />
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(168,85,247,0.45)_50%,transparent_100%)]"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 6, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
        />
      </div>

      {/* Subtle purple glow behind the logo area */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 w-72 h-40 rounded-full bg-purple-600/[0.06] blur-[80px]"
      />

      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-16 relative">

        {/* Top grid */}
        <div className="grid md:grid-cols-3 gap-12 mb-14">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <FooterMark />
              <span className="text-sm font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-300">
                MJ&nbsp;<span className="bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent">STORE</span>
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-[240px]">
              {translate("home.footer.description")}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-5">
              {translate("nav.quickLinks")}
            </p>
            <nav className="flex flex-col gap-3">
              {quickLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-zinc-400 hover:text-purple-300 transition-colors duration-150 flex items-center gap-2 group"
                >
                  <span className="text-purple-500/50 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all duration-200">→</span>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Support */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-5">
              Support
            </p>
            <nav className="flex flex-col gap-3">
              {supportLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-zinc-400 hover:text-purple-300 transition-colors duration-150 flex items-center gap-2 group"
                >
                  <span className="text-purple-500/50 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all duration-200">→</span>
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-purple-500/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-zinc-500 font-medium">
            {translate("home.footer.copyright")}
          </span>
          <span className="text-xs text-zinc-600 font-medium tracking-wider">
            MJ STORE — Premium Digital Marketplace
          </span>
        </div>

      </div>
    </footer>
  );
}
