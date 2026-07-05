import type { UserProfile } from "@zipath/types";
import { formatKoreanDate, formatKoreanDateTime } from "@/lib/dateFormat";

type ProviderLabel = NonNullable<UserProfile["provider"]>;

const PROVIDER_LABELS: Record<ProviderLabel, string> = {
  google: "Google",
  kakao: "카카오",
  naver: "네이버",
};

function getProviderLabel(provider: UserProfile["provider"]): string {
  if (!provider) return "알 수 없음";
  return PROVIDER_LABELS[provider] ?? provider;
}

interface UserInfoProps {
  user: Pick<UserProfile, "email" | "nickname" | "provider" | "createdAt" | "lastActiveAt">;
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
          <dd className="text-sm font-medium">
            {formatKoreanDate(user.createdAt)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-muted-foreground">마지막 활동</dt>
          <dd className="text-sm font-medium">
            {formatKoreanDateTime(user.lastActiveAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
