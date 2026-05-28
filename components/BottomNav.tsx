"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Map, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/trips", label: "Trips", icon: Map },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              active ? "text-ocean-600" : "text-muted"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
