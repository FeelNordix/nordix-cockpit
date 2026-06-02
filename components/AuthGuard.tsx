"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

type AuthGuardProps = {
  children: React.ReactNode;
};

const publicRoutes = ["/login"];

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const supabase = createSupabaseClient();
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const hasSession = Boolean(data.session);
      setIsAuthenticated(hasSession);
      setIsChecking(false);

      if (!hasSession && !isPublicRoute) {
        router.replace("/login");
      }

      if (hasSession && pathname === "/login") {
        router.replace("/");
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = Boolean(session);
      setIsAuthenticated(hasSession);
      setIsChecking(false);

      if (!hasSession && !isPublicRoute) {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isPublicRoute, pathname, router]);

  if (isPublicRoute) {
    return <>{children}</>;
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
