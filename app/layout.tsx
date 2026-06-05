import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import AppProviders from "../components/auth/AppProviders";

export const metadata: Metadata = {
  title: "MJ Store",
  description: "Premium Digital Marketplace",
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
        <Toaster
          position="top-right"
          toastOptions={{
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
