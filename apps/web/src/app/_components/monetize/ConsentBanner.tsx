"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "zipath.consent.v1";

/**
 * 최소 쿠키 동의 배너 (광고 개인화·분석 고지).
 * 한 번 동의하면 localStorage 에 저장되어 다시 뜨지 않습니다.
 */
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      /* localStorage 접근 불가 시 표시 안 함 */
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* 무시 */
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-sm sm:flex-row sm:justify-between">
        <p className="text-muted-foreground">
          이 사이트는 서비스 개선과 광고를 위해 쿠키를 사용합니다.{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            개인정보처리방침
          </a>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          동의
        </button>
      </div>
    </div>
  );
}
