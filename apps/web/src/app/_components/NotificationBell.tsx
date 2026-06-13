"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/** unread-count 폴링 주기 (ms) */
const POLL_INTERVAL_MS = 30_000;

/**
 * 헤더용 알림 종 아이콘.
 *
 * - 미로그인 시 아무것도 렌더링하지 않는다.
 * - 30 초 주기로 `GET /notifications/unread-count` 폴링.
 * - count > 99 → "99+", count === 0 → 뱃지 숨김.
 * - 클릭 시 `/notifications` 페이지로 이동.
 *
 * 본 알림은 참고용이며 법적 효력이 없습니다.
 */
export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const result = await fetchApi<number>(
          "/notifications/unread-count",
          { auth: true },
        );
        if (!cancelled) setCount(typeof result === "number" ? result : 0);
      } catch {
        // 폴링 실패는 무시 (네트워크/인증 오류 등)
      }
    };

    void fetchCount();
    const handle = setInterval(() => void fetchCount(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <Link
      href="/notifications"
      aria-label={
        count > 0 ? `읽지 않은 알림 ${label}개` : "알림"
      }
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {label}
        </span>
      )}
    </Link>
  );
}
