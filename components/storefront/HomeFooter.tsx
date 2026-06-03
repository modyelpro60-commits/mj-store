"use client";

import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export default function HomeFooter() {
  const { translate } = useLanguage();

  return (
    <footer id="contact" className="mt-24 border-t border-purple-500/20 bg-gradient-to-t from-black/60 to-black/20 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-8 py-24">
        <div className="grid md:grid-cols-2 gap-16 mb-16">
          <div>
            <h2 className="text-5xl font-black drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-300">MJ</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400">STORE</span>
            </h2>
            <p className="text-zinc-400 mt-6 max-w-lg leading-relaxed font-medium">
              {translate("home.footer.description")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-12 md:ml-auto">
            <div>
              <h3 className="font-black mb-6 text-white text-lg">
                {translate("nav.quickLinks")}
              </h3>
              <div className="flex flex-col gap-3">
                <Link href="#products" className="text-zinc-400 hover:text-white transition font-semibold flex items-center gap-2">
                  <span className="text-purple-400">→</span>
                  {translate("home.quickLinks.products")}
                </Link>
                <Link href="#reviews" className="text-zinc-400 hover:text-white transition font-semibold flex items-center gap-2">
                  <span className="text-purple-400">→</span>
                  {translate("home.quickLinks.reviews")}
                </Link>
                <Link href="#contact" className="text-zinc-400 hover:text-white transition font-semibold flex items-center gap-2">
                  <span className="text-purple-400">→</span>
                  {translate("home.quickLinks.contact")}
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-black mb-6 text-white text-lg">
                Support
              </h3>
              <div className="flex flex-col gap-3">
                <a href="#" className="text-zinc-400 hover:text-white transition font-semibold flex items-center gap-2">
                  <span className="text-purple-400">→</span>
                  Help Center
                </a>
                <a href="#" className="text-zinc-400 hover:text-white transition font-semibold flex items-center gap-2">
                  <span className="text-purple-400">→</span>
                  Privacy
                </a>
                <a href="#" className="text-zinc-400 hover:text-white transition font-semibold flex items-center gap-2">
                  <span className="text-purple-400">→</span>
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-500/15 pt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-zinc-500 font-medium">
            <p>{translate("home.footer.copyright")}</p>
            <div className="flex gap-6">
              <span>© 2025 MJ Store</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
