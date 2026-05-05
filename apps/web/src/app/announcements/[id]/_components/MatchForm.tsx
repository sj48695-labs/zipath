"use client";

import type { MatchFormData } from "./types";

interface MatchFormProps {
  value: MatchFormData;
  onChange: (next: MatchFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  disabled?: boolean;
  submitLabel?: string;
}

export default function MatchForm({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
  submitLabel,
}: MatchFormProps) {
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value: fieldValue } = e.target;
    onChange({ ...value, [name]: fieldValue });
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="age" className="mb-1 block text-sm font-medium">
            나이 (만)
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min="0"
            max="150"
            required
            placeholder="예: 30"
            value={value.age}
            onChange={handleInputChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="income" className="mb-1 block text-sm font-medium">
            연 소득 (만원)
          </label>
          <input
            id="income"
            name="income"
            type="number"
            min="0"
            required
            placeholder="예: 5000"
            value={value.income}
            onChange={handleInputChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            세전 가구 합산 연소득
          </p>
        </div>
        <div>
          <label
            htmlFor="homelessMonths"
            className="mb-1 block text-sm font-medium"
          >
            무주택 기간 (개월)
          </label>
          <input
            id="homelessMonths"
            name="homelessMonths"
            type="number"
            min="0"
            required
            placeholder="예: 36"
            value={value.homelessMonths}
            onChange={handleInputChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            세대 구성원 전원 기준
          </p>
        </div>
        <div>
          <label
            htmlFor="dependents"
            className="mb-1 block text-sm font-medium"
          >
            부양가족 수{" "}
            <span className="text-muted-foreground">(선택)</span>
          </label>
          <input
            id="dependents"
            name="dependents"
            type="number"
            min="0"
            placeholder="본인 제외"
            value={value.dependents}
            onChange={handleInputChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            본인/배우자 제외, 미성년 자녀 등
          </p>
        </div>
        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-medium">
            거주 지역{" "}
            <span className="text-muted-foreground">(선택)</span>
          </label>
          <input
            id="region"
            name="region"
            type="text"
            placeholder="예: 서울"
            value={value.region}
            onChange={handleInputChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.isMarried}
            onChange={(e) =>
              onChange({ ...value, isMarried: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          혼인 상태
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.isFirstHome}
            onChange={(e) =>
              onChange({ ...value, isFirstHome: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          생애최초 주택 구입
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || disabled}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "확인 중..." : (submitLabel ?? "자격 확인하기")}
      </button>
    </form>
  );
}
