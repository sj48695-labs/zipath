"use client";

import { useEffect, useRef } from "react";
import { coupangPartnersId } from "./config";

declare global {
  interface Window {
    PartnersCoupang?: {
      G: new (opts: Record<string, unknown>) => void;
    };
  }
}

let gScriptPromise: Promise<void> | null = null;

function loadCoupangScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.PartnersCoupang) return Promise.resolve();
  if (gScriptPromise) return gScriptPromise;

  gScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://ads-partners.coupang.com/g.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("coupang g.js load failed"));
    document.head.appendChild(s);
  });
  return gScriptPromise;
}

interface CoupangBannerProps {
  /** 쿠팡 파트너스 대시보드에서 만든 위젯(다이내믹 배너) ID */
  widgetId: number;
  template?: "carousel" | "banner";
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * 쿠팡 파트너스 다이내믹 배너.
 * env(NEXT_PUBLIC_COUPANG_PARTNERS_ID) 미설정 시 플레이스홀더.
 *
 * 주의: G() 에 넘기는 옵션은 쿠팡 대시보드가 생성해주는 스니펫과 반드시 일치시켜야 합니다.
 * (위젯을 만들면 나오는 코드에서 id / template / width / height 확인)
 */
export default function CoupangBanner({
  widgetId,
  template = "carousel",
  width = "100%",
  height = 140,
  className = "",
}: CoupangBannerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coupangPartnersId || !ref.current) return;
    let cancelled = false;

    loadCoupangScript()
      .then(() => {
        if (cancelled || !window.PartnersCoupang || !ref.current) return;
        ref.current.innerHTML = "";
        new window.PartnersCoupang.G({
          id: widgetId,
          trackingCode: coupangPartnersId,
          template,
          width,
          height,
          container: ref.current,
        });
      })
      .catch(() => {
        /* 로드 실패 시 무시 */
      });

    return () => {
      cancelled = true;
    };
  }, [widgetId, template, width, height]);

  if (!coupangPartnersId) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-amber-200 bg-amber-50 ${className}`}
      >
        <p className="py-6 text-xs text-amber-500">쿠팡 파트너스 배너 (승인 후 표시)</p>
      </div>
    );
  }

  return <div ref={ref} className={className} style={{ minHeight: height }} />;
}
