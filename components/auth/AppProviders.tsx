"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import ToastProvider from "../toast/ToastProvider";
import { LanguageProvider } from "../../lib/i18n/LanguageProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
