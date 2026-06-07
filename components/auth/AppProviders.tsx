"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { LanguageProvider } from "../../lib/i18n/LanguageProvider";
import LiveChat from "../chat/LiveChat";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <LiveChat />
      </AuthProvider>
    </LanguageProvider>
  );
}
