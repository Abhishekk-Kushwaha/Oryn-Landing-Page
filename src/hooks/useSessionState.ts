import { useEffect, useState } from "react";
import type { AppSession } from "../lib/account";
import { supabase } from "../components/lib/supabase";

/**
 * Session for the interactive demo.
 *
 * Identity (name, email) is the real signed-in Supabase user, so the demo's
 * Profile view shows the person exploring it. `is_pro` is intentionally forced
 * on: this is a showroom replica of the app, and locking features here would
 * hide the product we're trying to sell. Real entitlement is enforced by the
 * app at app.oryn-app.com, never here.
 *
 * Demo data itself stays in-memory (see storage.ts) and is never written to
 * Supabase — the landing page and the app share one project, so writing from
 * here would put demo noise into real users' tables.
 */
export function useSessionState() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const toDemoSession = (
      user: {
        id: string;
        email?: string;
        created_at?: string;
        user_metadata?: Record<string, unknown>;
      } | null,
    ): AppSession => ({
      user: {
        id: user?.id ?? "local-user",
        email: user?.email ?? null,
        created_at: user?.created_at ?? null,
        user_metadata: {
          full_name: (user?.user_metadata?.full_name as string | undefined) ?? null,
          name: (user?.user_metadata?.name as string | undefined) ?? null,
          is_pro: true,
        },
      },
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(toDemoSession(data.session?.user ?? null));
      setIsSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(toDemoSession(nextSession?.user ?? null));
      setIsSessionLoading(false);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    isSessionLoading,
  };
}
