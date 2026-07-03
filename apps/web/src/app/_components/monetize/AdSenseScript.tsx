"use client";

import Script from "next/script";
import { adsenseClient } from "./config";

/**
 * 애드센스 로더. layout 에 한 번만 렌더합니다.
 * env(NEXT_PUBLIC_ADSENSE_CLIENT) 가 없으면 아무것도 로드하지 않습니다.
 * 이 스크립트가 사이트 소유권 심사(자동 광고 코드) 역할도 겸합니다.
 */
export default function AdSenseScript() {
  if (!adsenseClient) return null;

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
    />
  );
}
