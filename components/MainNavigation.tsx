"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Klanten" },
  { href: "/trips", label: "Reisradar" }
];

export default function MainNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return null;
  }

  async function logout() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav aria-label="Hoofdnavigatie" className="flex gap-2">
      {navigation.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium text-white transition ${
              isActive
                ? "bg-nordix-pine shadow-sm"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        className="rounded-md px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 hover:text-white"
      >
        Uitloggen
      </button>
    </nav>
  );
}
