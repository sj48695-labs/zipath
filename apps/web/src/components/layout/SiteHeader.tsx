"use client";

import Link from "next/link";
import NotificationBell from "@/app/_components/NotificationBell";

interface SiteHeaderProps {
  maxWidth?: string;
}

const NAV_LINKS = [
  { href: "/subscription", label: "청약" },
  { href: "/loan", label: "대출" },
  { href: "/checklist", label: "체크리스트" },
  { href: "/real-price", label: "실거래가" },
] as const;

export default function SiteHeader({ maxWidth = "max-w-5xl" }: SiteHeaderProps) {
  return (
    <header className="border-b">
      <div
        className={`mx-auto flex h-16 ${maxWidth} items-center justify-between px-4`}
      >
        <Link href="/" className="text-xl font-bold text-primary">
          Zipath
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <NotificationBell />
        </nav>
      </div>
    </header>
  );
}
