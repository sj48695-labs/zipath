import { adsenseClient } from "@/app/_components/monetize/config";

// 애드센스 ads.txt — env 로부터 생성. 게시자 ID 미설정 시 빈 응답.
export const dynamic = "force-static";

export function GET() {
  // ca-pub-XXXX → pub-XXXX. 게시자 ID 미설정 시 주석만 있는 빈 ads.txt.
  const body = adsenseClient
    ? `google.com, ${adsenseClient.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# NEXT_PUBLIC_ADSENSE_CLIENT 미설정 — 애드센스 승인 후 자동 생성됩니다.\n";
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
