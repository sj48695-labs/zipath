"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/layout/SiteHeader";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserInfo } from "@/components/auth/UserInfo";

const MAX_REGIONS = 20;

function InterestRegionsSection({ regions }: { regions: string[] }) {
  const { updateInterestRegions } = useAuth();
  const [draft, setDraft] = useState<string[]>(regions);
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setDraft(regions);
  }, [regions]);

  const isDirty =
    draft.length !== regions.length ||
    draft.some((r, i) => r !== regions[i]);

  function addRegion() {
    const value = input.trim();
    setError(null);
    setJustSaved(false);
    if (!value) return;
    if (value.includes(",")) {
      setError("지역명에 쉼표를 포함할 수 없습니다.");
      return;
    }
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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
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
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
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
        <SiteHeader maxWidth="max-w-5xl" />
        <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
          <p className="text-muted-foreground">로딩 중...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader maxWidth="max-w-5xl" />
        <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
          <h1 className="mb-4 text-2xl font-bold">로그인이 필요합니다</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            프로필을 보려면 먼저 로그인해주세요.
          </p>
          <LoginButton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-5xl" />

      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold">내 프로필</h1>

        <UserInfo user={user} />

        <InterestRegionsSection regions={user.interestRegions} />

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
