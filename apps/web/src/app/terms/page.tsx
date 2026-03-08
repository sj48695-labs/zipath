import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - Zipath",
  description: "Zipath 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; 홈으로
      </Link>

      <h1 className="mt-6 text-3xl font-bold">이용약관</h1>
      <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 3월 8일</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제1조 (목적)</h2>
          <p>본 약관은 Zipath(이하 &quot;서비스&quot;)가 제공하는 부동산 정보 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제2조 (서비스의 내용)</h2>
          <p>서비스는 다음과 같은 기능을 제공합니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>청약 자격 시뮬레이션</li>
            <li>공공분양 공고 분석</li>
            <li>실거래가 조회</li>
            <li>대출 한도 계산기</li>
            <li>계약서 체크리스트</li>
            <li>부동산 용어 설명</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제3조 (면책 조항)</h2>
          <p className="font-medium text-foreground">
            본 서비스에서 제공하는 모든 정보는 참고용이며, 법적 효력이 없습니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>청약 자격 시뮬레이션 결과는 실제 청약 심사 결과와 다를 수 있습니다.</li>
            <li>대출 한도 계산 결과는 실제 금융기관 심사 결과와 다를 수 있습니다.</li>
            <li>실거래가 데이터는 국토교통부 공공데이터를 기반으로 하며, 최신 시세와 차이가 있을 수 있습니다.</li>
            <li>서비스는 법률 자문을 제공하지 않으며, 중요한 결정은 반드시 전문가와 상담하시기 바랍니다.</li>
            <li>서비스 이용으로 발생한 손해에 대해 서비스 제공자는 책임을 지지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제4조 (회원가입 및 계정)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>비회원도 일부 기능(시뮬레이션, 실거래가 조회 등)을 이용할 수 있습니다.</li>
            <li>회원가입은 소셜 로그인(Google, Kakao, Naver)을 통해 가능합니다.</li>
            <li>1년간 미접속 시 계정이 자동 삭제될 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제5조 (서비스 이용 제한)</h2>
          <p>다음 행위를 하는 경우 서비스 이용이 제한될 수 있습니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>서비스를 이용하여 불법 행위를 하는 경우</li>
            <li>비정상적인 방법으로 서비스에 과도한 부하를 발생시키는 경우</li>
            <li>타인의 개인정보를 침해하는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제6조 (유료 서비스)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>기본 기능은 무료로 제공됩니다.</li>
            <li>계약서 분석 등 일부 프리미엄 기능은 유료로 제공될 수 있습니다.</li>
            <li>유료 서비스의 가격 및 내용은 서비스 내에서 별도 안내합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제7조 (지적 재산권)</h2>
          <p>서비스의 디자인, 코드, 콘텐츠에 대한 저작권은 서비스 제공자에게 있습니다. 공공데이터는 각 제공 기관의 이용 약관을 따릅니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제8조 (약관 변경)</h2>
          <p>본 약관이 변경되는 경우 서비스 내 공지를 통해 안내하며, 변경된 약관은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제9조 (문의)</h2>
          <p>서비스 이용 관련 문의는 아래로 연락해 주세요.</p>
          <p className="mt-1">이메일: support@zipath.kr</p>
        </section>
      </div>
    </div>
  );
}
