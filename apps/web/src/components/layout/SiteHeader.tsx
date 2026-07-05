"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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

const DISCLAIMER_TEXT =
  "참고용이며 법적 효력 없음. 실제 계약, 청약, 대출 판단 전에는 반드시 공식 문서와 담당 기관 안내를 확인하세요.";

export default function SiteHeader({ maxWidth = "max-w-5xl" }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-2 text-amber-900">
        <div
          className={`mx-auto flex ${maxWidth} items-start gap-2 text-xs leading-5`}
        >
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
            법적 고지
          </span>
          <p className="min-w-0 flex-1">{DISCLAIMER_TEXT}</p>
        </div>
      </div>
      <header className="relative border-b">
        <div
          className={`mx-auto flex h-16 ${maxWidth} items-center justify-between px-4`}
        >
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <NotificationBell />
            <button
              type="button"
              className="hover:text-foreground md:hidden"
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? "mobile-nav-menu" : undefined}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            {menuOpen && (
              <div
                id="mobile-nav-menu"
                className="absolute inset-x-0 top-16 z-10 border-b bg-background md:hidden"
              >
                <div
                  className={`mx-auto flex ${maxWidth} flex-col gap-4 px-4 py-4`}
                >
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="hover:text-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>
      </header>
    </div>
  );
}
