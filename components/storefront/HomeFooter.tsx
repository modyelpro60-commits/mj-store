"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { MJMark } from "../brand/MJLogo";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const PAYMENT_METHODS = [
  { icon: Smartphone, label: "Vodafone Cash", color: "text-red-400"    },
  { icon: CreditCard, label: "InstaPay",      color: "text-purple-400" },
  { icon: Wallet,     label: "USDT (BEP20)",  color: "text-yellow-400" },
] as const;

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-5">
        {title}
      </p>
      {children}
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-purple-300 transition-colors duration-150 group"
    >
      <span className="text-purple-500/40 transition-all duration-200 group-hover:text-purple-400 group-hover:translate-x-0.5">
        →
      </span>
      {label}
    </Link>
  );
}

export default function HomeFooter() {
  const { translate } = useLanguage();

  const STORE_LINKS = [
    { href: "/#products",     label: translate("home.footer.link.products")    },
    { href: "/#best-sellers", label: translate("home.footer.link.bestSellers") },
    { href: "/#contact",      label: translate("home.footer.link.contact")     },
  ];

  const CUSTOMER_LINKS = [
    { href: "/welcome",   label: translate("home.footer.link.myAccount")   },
    { href: "/chat",      label: translate("home.footer.link.supportChat")  },
    { href: "/#products", label: translate("home.footer.link.browseStore")  },
  ];

  const LEGAL_LINKS = [
    { href: "#", label: translate("home.footer.link.privacyPolicy")   },
    { href: "#", label: translate("home.footer.link.termsOfService")  },
    { href: "#", label: translate("home.footer.link.refundPolicy")    },
  ];

  return (
    <footer id="contact" className="relative bg-gradient-to-t from-black/70 to-black/20 backdrop-blur-xl">

      {/* Animated shimmer border at top */}
      <div className="relative h-px overflow-hidden">
        <div className="absolute inset-0 bg-purple-500/15" />
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(168,85,247,0.5)_50%,transparent_100%)]"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 6, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
        />
      </div>

      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute top-0 left-0 h-48 w-80 rounded-full bg-purple-600/[0.05] blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-48 w-64 rounded-full bg-fuchsia-600/[0.04] blur-[80px]" />

      <div className="relative max-w-[1600px] mx-auto px-6 md:px-8 py-16">

        {/* ── Main grid ── */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] mb-14">

          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <MJMark size={28} />
              <span className="text-sm font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-300">
                MJ&nbsp;
                <span className="bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
                  STORE
                </span>
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-[220px]">
              {translate("home.footer.brand.desc")}
            </p>

            {/* Payment badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(({ icon: Icon, label, color }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-zinc-900/60 px-3 py-1.5 text-[11px] font-bold text-zinc-400"
                >
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Store */}
          <FooterColumn title={translate("home.footer.col.store")}>
            <nav className="flex flex-col gap-3">
              {STORE_LINKS.map((l) => <NavLink key={l.href} {...l} />)}
            </nav>
          </FooterColumn>

          {/* Customer */}
          <FooterColumn title={translate("home.footer.col.customer")}>
            <nav className="flex flex-col gap-3">
              {CUSTOMER_LINKS.map((l) => <NavLink key={l.href} {...l} />)}
            </nav>
          </FooterColumn>

          {/* Legal */}
          <FooterColumn title={translate("home.footer.col.legal")}>
            <nav className="flex flex-col gap-3">
              {LEGAL_LINKS.map((l) => <NavLink key={l.label} {...l} />)}
            </nav>
          </FooterColumn>

          {/* Payments */}
          <FooterColumn title={translate("home.footer.col.payments")}>
            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map(({ icon: Icon, label, color }) => (
                <span key={label} className="flex items-center gap-2 text-sm text-zinc-400">
                  <Icon className={`h-4 w-4 ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </FooterColumn>

        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-purple-500/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-zinc-500 font-medium">
            {translate("home.footer.copyright")}
          </span>
          <span className="text-xs text-zinc-600 font-medium tracking-wider">
            {translate("home.footer.tagline")}
          </span>
        </div>

      </div>
    </footer>
  );
}
