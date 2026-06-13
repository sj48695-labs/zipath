"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const UNREAD_POLL_MS = 30_000;

export function Header() {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }

    const controller = new AbortController();

    const fetchUnread = async () => {
      try {
        const count = await fetchApi<number>("/notifications/unread-count", {
          auth: true,
          signal: controller.signal,
        });
        setUnread((prev) => (prev === count ? prev : count));
      } catch {
        // silent — 다음 폴링 주기에 재시도
      }
    };

    void fetchUnread();
    const timer = setInterval(() => void fetchUnread(), UNREAD_POLL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [isAuthenticated]);

  const badgeLabel = unread > 99 ? "99+" : String(unread);

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Zipath
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/subscription" className="hover:text-foreground">
            청약
          </Link>
          <Link href="/real-price" className="hover:text-foreground">
            실거래가
          </Link>
          <Link
            href="/notifications"
            aria-label="알림"
            className="relative hover:text-foreground"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white leading-none">
                {badgeLabel}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
