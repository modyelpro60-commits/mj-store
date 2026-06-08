"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { LanguageProvider } from "../../lib/i18n/LanguageProvider";
import { CartProvider } from "../cart/CartProvider";
import LiveChat from "../chat/LiveChat";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <LiveChat />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
