"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop All" },
  { href: "/hot-items", label: "\u{1F525} Hot" },
  { href: "/new-arrivals", label: "\u{2728} New" },
  { href: "/sets", label: "Sets" },
  { href: "/types", label: "Types" },
];

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-brand overflow-x-auto scrollbar-hide">
      <div className="relative max-w-7xl mx-auto px-4 flex items-center gap-1 h-10 min-w-max">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <a
              key={link.href}
              href={link.href}
              className={`pressable relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-[color] duration-[var(--dur-fast)] ease-[var(--ease-out)] ${
                isActive
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 bg-white/20 rounded-lg"
                  transition={{ type: "spring", damping: 25, stiffness: 350, mass: 0.5 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
