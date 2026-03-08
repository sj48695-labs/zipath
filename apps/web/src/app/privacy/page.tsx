import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - Zipath",
  description: "Zipath 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; 홈으로
      </Link>

      <h1 className="mt-6 text-3xl font-bold">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 3월 8일</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">1. 개인정보의 수집 항목 및 수집 방법</h2>
          <p>Zipath(이하 &quot;서비스&quot;)는 다음과 같은 개인정보를 수집합니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>회원가입 시:</strong> 이메일, 닉네임, 소셜 로그인 정보(Google, Kakao, Naver 제공 식별자)</li>
            <li><strong>서비스 이용 시:</strong> 청약 시뮬레이션 입력 정보(나이, 소득, 무주택 기간 등), 실거래가 검색 기록</li>
            <li><strong>자동 수집:</strong> 접속 로그, 쿠키, 접속 IP</li>
          </ul>
          <p className="mt-2">비회원도 시뮬레이션 등 일부 기능을 이용할 수 있으며, 이 경우 개인정보를 수집하지 않습니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>청약 자격 시뮬레이션, 대출 한도 계산 등 서비스 제공</li>
            <li>회원 관리 및 본인 확인</li>
            <li>서비스 개선 및 통계 분석</li>
            <li>고객 문의 대응</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">3. 개인정보의 보유 및 이용 기간</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 탈퇴 시 즉시 삭제</li>
            <li>1년간 미접속 계정: 자동 삭제</li>
            <li>실거래가 캐시 데이터: 3개월 경과 시 삭제</li>
            <li>공공분양 공고 데이터: 마감 후 6개월 경과 시 삭제</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">4. 개인정보의 제3자 제공</h2>
          <p>서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의해 요구되는 경우는 예외로 합니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">5. 개인정보의 처리 위탁</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Vercel:</strong> 웹 호스팅</li>
            <li><strong>Render:</strong> API 서버 호스팅</li>
            <li><strong>Neon:</strong> 데이터베이스 호스팅</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">6. 이용자의 권리</h2>
          <p>이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며, 회원 탈퇴를 통해 개인정보 처리 정지를 요청할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">7. 쿠키의 사용</h2>
          <p>서비스는 로그인 유지 및 사용자 경험 개선을 위해 쿠키를 사용합니다. 브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">8. 개인정보 보호책임자</h2>
          <p>개인정보 관련 문의는 아래로 연락해 주세요.</p>
          <p className="mt-1">이메일: support@zipath.kr</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">9. 방침 변경</h2>
          <p>본 방침이 변경되는 경우 서비스 내 공지를 통해 안내합니다.</p>
        </section>
      </div>
    </div>
  );
}
