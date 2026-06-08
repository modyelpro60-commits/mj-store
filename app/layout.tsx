import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AppProviders from "../components/auth/AppProviders";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MJ STORE",
    template: "%s · MJ STORE",
  },
  description:
    "Instant delivery for premium subscriptions, digital services, and gaming perks — fast after payment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${geistSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
        <Toaster
          position="top-right"
          gap={12}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              borderRadius: "1rem",
              boxShadow: "0 20px 70px rgba(0,0,0,0.5)",
            },
          }}
        />
      </body>
    </html>
  );
}
