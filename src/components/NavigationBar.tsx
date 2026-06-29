"use client";

import { usePathname } from "next/navigation";

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
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-10 min-w-max">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <a
              key={link.href}
              href={link.href}
              className={`pressable px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-[background-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
