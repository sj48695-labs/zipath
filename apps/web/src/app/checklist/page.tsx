import Link from "next/link";

const types = [
  {
    type: "rent",
    title: "월세",
    description: "월세 계약 시 꼭 확인해야 할 항목들",
    color: "bg-blue-50 border-blue-200",
  },
  {
    type: "jeonse",
    title: "전세",
    description: "전세 계약 시 안전하게 확인할 체크리스트",
    color: "bg-green-50 border-green-200",
  },
  {
    type: "buy",
    title: "매매",
    description: "내 집 마련, 매매 계약 시 필수 확인 사항",
    color: "bg-orange-50 border-orange-200",
  },
];

export default function ChecklistPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">계약서 체크리스트</h1>
        <p className="mb-8 text-muted-foreground">
          계약 유형을 선택하면 맞춤 체크리스트를 확인할 수 있어요.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {types.map((t) => (
            <Link
              key={t.type}
              href={`/checklist/${t.type}`}
              className={`rounded-lg border p-6 transition-shadow hover:shadow-md ${t.color}`}
            >
              <h2 className="mb-2 text-xl font-bold">{t.title}</h2>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
