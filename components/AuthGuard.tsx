"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

type AuthGuardProps = {
  children: React.ReactNode;
};

const publicRoutes = ["/login", "/reset-password"];

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function checkSession() {
      try {
        const supabase = createSupabaseClient();

        const { data } = await withTimeout(
          supabase.auth.getSession(),
          "Supabase sessie controleren"
        );

        if (!isMounted) {
          return;
        }

        const hasSession = Boolean(data.session);
        setIsAuthenticated(hasSession);
        setIsChecking(false);
        setAuthError("");

        if (!hasSession && !isPublicRoute) {
          router.replace("/login");
        }

        if (hasSession && pathname === "/login") {
          router.replace("/");
        }

        const authListener = supabase.auth.onAuthStateChange(
          (_event, session) => {
            const hasActiveSession = Boolean(session);
            setIsAuthenticated(hasActiveSession);
            setIsChecking(false);
            setAuthError("");

            if (!hasActiveSession && !isPublicRoute) {
              router.replace("/login");
            }
          }
        );

        subscription = authListener.data.subscription;
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setIsChecking(false);
        setIsAuthenticated(false);
        setAuthError(
          error instanceof Error
            ? error.message
            : "Supabase sessie controleren is mislukt."
        );
      }
    }

    checkSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [isPublicRoute, pathname, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (authError) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-800">
          Sessie controleren is mislukt.
        </p>
        <p className="mt-2 text-sm text-red-700">{authError}</p>
      </section>
    );
  }

  if (isChecking || !isAuthenticated) {
    return (
      <section className="rounded-lg border border-nordix-mist bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-700">
          Sessie controleren...
        </p>
      </section>
    );
  }

  return <>{children}</>;
}

async function withTimeout<T>(
  promise: PromiseLike<T>,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} gaf geen resultaat binnen 10 seconden.`));
      }, 10000);
    })
  ]);
}
