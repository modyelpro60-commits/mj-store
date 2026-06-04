"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient, type Session } from "@supabase/supabase-js";

type AuthProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
  created_at: string | null;
};

type AuthContextValue = {
  session: Session | null;
  accessToken: string | null;
  profile: AuthProfile | null;
  role: string | null;
  status: string | null;
  isLoading: boolean;

  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(role: unknown): string | null {
  if (typeof role !== "string") return null;
  const trimmed = role.trim();
  return trimmed.length ? trimmed : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

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

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function reloadProfile(tokenOverride?: string | null) {
    const token = tokenOverride ?? accessToken;

    if (!token) {
      setProfile(null);
      return;
    }

    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Server-side status enforcement (Suspended/Banned -> 403).
    // We do NOT redirect here — the login page or a hard navigation
    // already set the ?accountStatus= param. Just clear profile.
    if (res.status === 403) {
      setProfile(null);
      return;
    }

    // If we can’t validate the session, clear local profile.
    if (!res.ok) {
      setProfile(null);
      return;
    }

    const data = (await res.json()) as {
      user: { id: string; email: string | null } | null;
      profile:
        | (Omit<AuthProfile, "role" | "status"> & {
            role: unknown;
            status: unknown;
          })
        | null;
    };

    if (!data.profile) {
      setProfile(null);
      return;
    }

    const role = normalizeRole(data.profile.role);
    if (!role) {
      setProfile(null);
      return;
    }

    const status =
      typeof data.profile.status === "string" ? data.profile.status : null;

    setProfile({
      ...(data.profile as any),
      role,
      status,
    });
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

        // If session exists, fetch role/profile using the freshly read token.
        if (token) {
          await reloadProfile(token);
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
          await reloadProfile(token);
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
      status: profile?.status ?? null,
      isLoading,
      signOut,
      reloadProfile: async () => reloadProfile(),
    }),
    [session, accessToken, profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");

  return ctx;
}
