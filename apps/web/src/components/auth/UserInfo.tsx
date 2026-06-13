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

interface UserInfoProps {
  user: {
    email: string | null;
    nickname: string | null;
    provider: string | null;
    createdAt: string;
    lastActiveAt: string;
  };
}

export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          {user.nickname?.charAt(0) ?? user.email?.charAt(0) ?? "?"}
        </div>
        <div>
          <p className="font-semibold">{user.nickname ?? "닉네임 없음"}</p>
          <p className="text-sm text-muted-foreground">
            {user.email ?? "이메일 없음"}
          </p>
        </div>
      </div>

      <hr className="mb-6" />

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
          <dd className="text-sm font-medium">{formatDate(user.createdAt)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-muted-foreground">마지막 활동</dt>
          <dd className="text-sm font-medium">
            {formatDateTime(user.lastActiveAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
