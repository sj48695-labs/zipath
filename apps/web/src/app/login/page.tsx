"use client";

import Link from "next/link";

const OAUTH_PROVIDERS = [
  {
    id: "google" as const,
    name: "Google",
    color: "bg-white border hover:bg-gray-50",
    textColor: "text-gray-700",
    icon: "G",
  },
  {
    id: "kakao" as const,
    name: "카카오",
    color: "bg-[#FEE500] hover:bg-[#FDD800]",
    textColor: "text-[#191919]",
    icon: "K",
  },
  {
    id: "naver" as const,
    name: "네이버",
    color: "bg-[#03C75A] hover:bg-[#02B350]",
    textColor: "text-white",
    icon: "N",
  },
];

function handleOAuthLogin(provider: string) {
  // OAuth 플로우: 프론트에서 Provider 로그인 페이지로 리다이렉트
  // 콜백에서 profile 정보를 받아 POST /api/auth/login 호출
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  window.location.href = `${apiUrl}/auth/oauth/${provider}`;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <h1 className="mb-2 text-2xl font-bold">로그인</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          소셜 계정으로 간편하게 시작하세요
        </p>

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
