// src/components/NavTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Eventos" },
  { href: "/calendar", label: "Calendário" },
  { href: "/dashboard", label: "Dashboard" }
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 text-xs text-zinc-400">
      {TABS.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "inline-flex items-center rounded-full px-3 py-1 transition-all border",
              active
                ? "border-jack-gold/70 bg-zinc-900/90 text-zinc-50 shadow-[0_0_18px_rgba(207,163,95,0.35)]"
                : "border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:text-zinc-100"
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
