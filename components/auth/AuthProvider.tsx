"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";

type AuthProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "customer";
  created_at: string | null;
};

type AuthContextValue = {
  session: Session | null;
  accessToken: string | null;
  profile: AuthProfile | null;
  role: "admin" | "customer" | null;
  isLoading: boolean;

  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function safeRole(role: unknown): "admin" | "customer" | null {
  if (role === "admin" || role === "customer") return role;
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  async function reloadProfile() {
    const token = accessToken;

    if (!token) {
      setProfile(null);
      return;
    }

    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json()) as {
      user: { id: string; email: string | null } | null;
      profile: Omit<AuthProfile, "role"> & { role: unknown } | null;
    };

    if (!data.profile) {
      setProfile(null);
      return;
    }

    const role = safeRole(data.profile.role);
    setProfile(role ? { ...(data.profile as any), role } : null);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const nextSession = data.session ?? null;
        setSession(nextSession);

        const token = nextSession?.access_token ?? null;
        setAccessToken(token);

        // If session exists, fetch role/profile.
        if (token) {
          await reloadProfile();
        } else {
          setProfile(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        const token = nextSession?.access_token ?? null;
        setAccessToken(token);

        if (token) {
          await reloadProfile();
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      session,
      accessToken,
      profile,
      role: profile?.role ?? null,
      isLoading,
      signOut,
      reloadProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, accessToken, profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");

  return ctx;
}
