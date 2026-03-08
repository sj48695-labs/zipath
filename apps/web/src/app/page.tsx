import Link from "next/link";

const features = [
  {
    title: "청약 자격 시뮬레이션",
    description: "나이, 소득, 무주택 기간을 입력하면 청약 가능 여부를 바로 확인할 수 있어요.",
    href: "/subscription",
    icon: "🏠",
  },
  {
    title: "대출 한도 계산기",
    description: "연소득과 기존 대출을 기반으로 받을 수 있는 대출 금액을 계산해드려요.",
    href: "/loan",
    icon: "💰",
  },
  {
    title: "계약서 체크리스트",
    description: "월세, 전세, 매매 유형별로 계약 시 꼭 확인해야 할 항목을 정리했어요.",
    href: "/checklist",
    icon: "✅",
  },
  {
    title: "실거래가 조회",
    description: "국토교통부 실거래가 데이터로 관심 지역의 시세를 확인하세요.",
    href: "/real-price",
    icon: "📊",
  },
  {
    title: "공공분양 공고",
    description: "최신 공공분양 공고를 한눈에 확인하고, 주요 정보를 요약해드려요.",
    href: "/announcements",
    icon: "📢",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">Zipath</span>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/subscription" className="hover:text-foreground">
              청약
            </Link>
            <Link href="/loan" className="hover:text-foreground">
              대출
            </Link>
            <Link href="/checklist" className="hover:text-foreground">
              체크리스트
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          내 집으로 가는 길,{" "}
          <span className="text-primary">Zipath</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          부동산이 처음이라도 괜찮아요. 청약 자격 확인부터 계약서 체크리스트까지,
          필요한 모든 정보를 한 곳에서 확인하세요.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/subscription"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            청약 자격 확인하기
          </Link>
          <Link
            href="/checklist"
            className="rounded-lg border px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            체크리스트 보기
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-secondary/30 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-bold">
            주요 기능
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        <p>Zipath - 부동산 입문자를 위한 올인원 가이드</p>
        <p className="mt-2">
          본 서비스에서 제공하는 모든 정보는 참고용이며, 법적 효력이 없습니다.
        </p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            이용약관
          </Link>
        </div>
      </footer>
    </div>
  );
}
