"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const checklists: Record<
  string,
  { title: string; items: { category: string; content: string; isRequired: boolean }[] }
> = {
  rent: {
    title: "월세 계약 체크리스트",
    items: [
      { category: "서류 확인", content: "등기부등본 확인 (소유자, 근저당 설정)", isRequired: true },
      { category: "서류 확인", content: "건축물대장 확인 (불법건축물 여부)", isRequired: true },
      { category: "서류 확인", content: "임대인 신분증 확인", isRequired: true },
      { category: "현장 확인", content: "수도/전기/가스 정상 작동 확인", isRequired: true },
      { category: "현장 확인", content: "곰팡이, 누수 흔적 확인", isRequired: true },
      { category: "현장 확인", content: "방음 상태 확인", isRequired: false },
      { category: "계약 조건", content: "보증금 및 월세 금액 확인", isRequired: true },
      { category: "계약 조건", content: "관리비 포함 항목 확인", isRequired: true },
      { category: "계약 조건", content: "계약 기간 및 갱신 조건 확인", isRequired: true },
      { category: "계약 조건", content: "특약사항 기재 (원상복구 범위 등)", isRequired: false },
    ],
  },
  jeonse: {
    title: "전세 계약 체크리스트",
    items: [
      { category: "서류 확인", content: "등기부등본 확인 (근저당, 가압류 등)", isRequired: true },
      { category: "서류 확인", content: "건축물대장 확인", isRequired: true },
      { category: "서류 확인", content: "임대인 신분증 및 인감증명서 확인", isRequired: true },
      { category: "서류 확인", content: "국세/지방세 완납증명서 확인", isRequired: true },
      { category: "안전장치", content: "전세보증보험 가입 가능 여부 확인", isRequired: true },
      { category: "안전장치", content: "전입신고 및 확정일자 즉시 진행", isRequired: true },
      { category: "현장 확인", content: "주택 상태 점검 (누수, 결로 등)", isRequired: true },
      { category: "계약 조건", content: "보증금 반환 조건 확인", isRequired: true },
      { category: "계약 조건", content: "계약 갱신청구권 안내 확인", isRequired: true },
    ],
  },
  buy: {
    title: "매매 계약 체크리스트",
    items: [
      { category: "서류 확인", content: "등기부등본 확인 (소유권, 근저당, 가압류)", isRequired: true },
      { category: "서류 확인", content: "건축물대장 확인 (용도, 면적, 위반건축물)", isRequired: true },
      { category: "서류 확인", content: "토지이용계획확인서 확인", isRequired: true },
      { category: "서류 확인", content: "매도인 신분증 및 인감증명서 확인", isRequired: true },
      { category: "자금 계획", content: "대출 사전승인 확인", isRequired: true },
      { category: "자금 계획", content: "취득세 및 부대비용 계산", isRequired: true },
      { category: "현장 확인", content: "주택 내부 상태 점검", isRequired: true },
      { category: "현장 확인", content: "주변 환경 및 소음 확인", isRequired: false },
      { category: "계약 조건", content: "계약금/중도금/잔금 일정 확인", isRequired: true },
      { category: "계약 조건", content: "소유권 이전 등기 일정 확인", isRequired: true },
      { category: "계약 조건", content: "하자 보수 책임 범위 확인", isRequired: false },
    ],
  },
};

export default function ChecklistDetailPage() {
  const params = useParams();
  const type = params.type as string;
  const checklist = checklists[type];

  const [checked, setChecked] = useState<Set<number>>(new Set());

  if (!checklist) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>존재하지 않는 체크리스트입니다.</p>
      </div>
    );
  }

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const total = checklist.items.length;
  const done = checked.size;
  const percentage = Math.round((done / total) * 100);

  const categories = [...new Set(checklist.items.map((i) => i.category))];

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/checklist" className="text-sm text-muted-foreground hover:text-foreground">
            체크리스트
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">{checklist.title}</h1>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {done}/{total} 완료
            </span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Items by category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </h2>
              <div className="space-y-2">
                {checklist.items
                  .map((item, index) => ({ ...item, index }))
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <label
                      key={item.index}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                        checked.has(item.index) ? "bg-primary/5 border-primary/30" : "hover:bg-secondary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(item.index)}
                        onChange={() => toggle(item.index)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                      />
                      <span
                        className={`text-sm ${checked.has(item.index) ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.content}
                        {item.isRequired && (
                          <span className="ml-1 text-xs text-red-500">*필수</span>
                        )}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
