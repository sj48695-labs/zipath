"use client";

import { useState } from "react";
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

const MAX_REGIONS = 20;

function InterestRegionsSection({ regions }: { regions: string[] }) {
  const { updateInterestRegions } = useAuth();
  const [draft, setDraft] = useState<string[]>(regions);
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const isDirty =
    draft.length !== regions.length ||
    draft.some((r, i) => r !== regions[i]);

  function addRegion() {
    const value = input.trim();
    setError(null);
    setJustSaved(false);
    if (!value) return;
    if (draft.includes(value)) {
      setError("이미 추가된 지역입니다.");
      return;
    }
    if (draft.length >= MAX_REGIONS) {
      setError(`관심 지역은 최대 ${MAX_REGIONS}개까지 등록할 수 있습니다.`);
      return;
    }
    setDraft([...draft, value]);
    setInput("");
  }

  function removeRegion(region: string) {
    setError(null);
    setJustSaved(false);
    setDraft(draft.filter((r) => r !== region));
  }

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      await updateInterestRegions(draft);
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border bg-card p-6">
      <h2 className="mb-1 text-lg font-semibold">관심 지역</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        관심 지역을 등록하면 실거래가, 청약 공고 알림에 활용됩니다.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addRegion();
            }
          }}
          placeholder="예: 서울 강남구"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          aria-label="관심 지역 입력"
        />
        <button
          type="button"
          onClick={addRegion}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          추가
        </button>
      </div>

      {draft.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          등록된 관심 지역이 없습니다.
        </p>
      ) : (
        <ul className="mb-4 flex flex-wrap gap-2">
          {draft.map((region) => (
            <li
              key={region}
              className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm"
            >
              <span>{region}</span>
              <button
                type="button"
                onClick={() => removeRegion(region)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`${region} 삭제`}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {justSaved && !isDirty && (
        <p className="mb-3 text-sm text-green-600">저장되었습니다.</p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={isSaving || !isDirty}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
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

        {/* Interest regions */}
        <InterestRegionsSection regions={user.interestRegions ?? []} />

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
