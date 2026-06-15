"use client";

import Link from "next/link";
import NotificationBell from "@/app/_components/NotificationBell";

interface SiteHeaderProps {
  /** 헤더 컨테이너 폭. 페이지 본문 폭과 정렬한다. */
  maxWidth?: string;
}

const NAV_LINKS = [
  { href: "/subscription", label: "청약" },
  { href: "/loan", label: "대출" },
  { href: "/checklist", label: "체크리스트" },
  { href: "/real-price", label: "실거래가" },
] as const;

/**
 * 전 페이지 공용 사이트 헤더.
 *
 * - 로고(`/`) + nav(청약/대출/체크리스트/실거래가) + 알림종을 일관되게 노출한다.
 * - `maxWidth` 로 각 페이지 본문 폭에 맞춰 정렬한다(기본 `max-w-5xl`).
 */
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
