"use client";

import { useEffect } from "react";
import { adsenseClient } from "./config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdBannerProps {
  /** 애드센스 대시보드에서 발급한 광고 슬롯 ID */
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

/**
 * 인피드/디스플레이 광고 단위.
 * env 미설정 시 회색 플레이스홀더로 렌더 → 승인 전에도 레이아웃이 안 깨집니다.
 */
export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  useEffect(() => {
    if (!adsenseClient) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기 등으로 실패해도 무시
    }
  }, [slot]);

  if (!adsenseClient) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 ${className}`}
      >
        <div className="py-4 text-center">
          <p className="text-xs text-gray-400">광고 영역</p>
          <p className="text-[10px] text-gray-300">
            {format === "horizontal" ? "728x90" : format === "vertical" ? "160x600" : "336x280"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: "block" }}
      data-ad-client={adsenseClient}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
