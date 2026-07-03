// 수익화 설정 — 전부 env 로만 켜짐. ID 를 넣기 전까지는 모든 컴포넌트가 플레이스홀더로 동작합니다.
//
// .env 예시:
//   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
//   NEXT_PUBLIC_COUPANG_PARTNERS_ID=AF1234567
//
// 이 파일은 프로젝트 간 이식을 전제로 프레임워크 의존이 없습니다(순수 env 읽기).

/** 애드센스 게시자 ID (예: ca-pub-XXXXXXXXXXXXXXXX). 미설정 시 광고 비활성. */
export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/** 쿠팡 파트너스 트래킹 코드 (예: AF1234567). 미설정 시 배너 비활성. */
export const coupangPartnersId = process.env.NEXT_PUBLIC_COUPANG_PARTNERS_ID ?? "";

export const adsenseEnabled = adsenseClient.length > 0;
export const coupangEnabled = coupangPartnersId.length > 0;
