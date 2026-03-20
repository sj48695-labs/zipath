"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type ProviderLabel = "google" | "kakao" | "naver";

const PROVIDER_LABELS: Record<ProviderLabel, string> = {
  google: "Google",
  kakao: "카카오",
  naver: "네이버",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProviderLabel(provider: string | null): string {
  if (!provider) return "알 수 없음";
  return PROVIDER_LABELS[provider as ProviderLabel] ?? provider;
}

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (isLoading) {
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
          <p className="text-muted-foreground">로딩 중...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
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
          <h1 className="mb-4 text-2xl font-bold">로그인이 필요합니다</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            프로필을 보려면 먼저 로그인해주세요.
          </p>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            로그인하기
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              홈
            </Link>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              로그아웃
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold">내 프로필</h1>

        <div className="rounded-lg border bg-card p-6">
          {/* Profile avatar placeholder */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {user.nickname?.charAt(0) ?? user.email?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="font-semibold">
                {user.nickname ?? "닉네임 없음"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user.email ?? "이메일 없음"}
              </p>
            </div>
          </div>

          <hr className="mb-6" />

          {/* Profile details */}
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">이메일</dt>
              <dd className="text-sm font-medium">
                {user.email ?? "등록되지 않음"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">닉네임</dt>
              <dd className="text-sm font-medium">
                {user.nickname ?? "등록되지 않음"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">로그인 방식</dt>
              <dd className="text-sm font-medium">
                {getProviderLabel(user.provider)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">가입일</dt>
              <dd className="text-sm font-medium">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">마지막 활동</dt>
              <dd className="text-sm font-medium">
                {formatDateTime(user.lastActiveAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-accent"
          >
            홈으로 돌아가기
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            로그아웃
          </button>
        </div>
      </main>
    </div>
  );
}
