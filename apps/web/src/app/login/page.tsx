"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import { OAUTH_PROVIDERS, getOAuthLoginUrl } from "./oauth-providers";

function handleOAuthLogin(provider: "google" | "kakao" | "naver" | "apple") {
  // OAuth 플로우: 프론트에서 Provider 로그인 페이지로 리다이렉트
  // 콜백에서 profile 정보를 받아 POST /api/auth/login 호출
  window.location.href = getOAuthLoginUrl(provider);
}

export default function LoginPage() {
  const [oauthError, setOAuthError] = useState(false);

  useEffect(() => {
    setOAuthError(new URLSearchParams(window.location.search).get("error") === "apple_authorization_cancelled");
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-5xl" />

      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <h1 className="mb-2 text-2xl font-bold">로그인</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          소셜 계정으로 간편하게 시작하세요
        </p>
        {oauthError && (
          <p className="mb-4 text-center text-sm text-destructive">
            Apple 로그인이 취소되었거나 승인되지 않았습니다. 다시 시도해 주세요.
          </p>
        )}

        <div className="w-full space-y-3">
          {OAUTH_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleOAuthLogin(provider.id)}
              className={`flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${provider.color} ${provider.textColor}`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                {provider.icon}
              </span>
              {provider.name}로 계속하기
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          로그인 없이도 모든 기본 기능을 이용할 수 있습니다.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          참고용이며 법적 효력 없음
        </p>
        <Link
          href="/"
          className="mt-4 text-sm text-primary hover:underline"
        >
          로그인 없이 둘러보기
        </Link>
      </main>
    </div>
  );
}
