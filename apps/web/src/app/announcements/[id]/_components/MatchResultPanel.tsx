"use client";

import type { MatchResult } from "./types";

interface MatchResultPanelProps {
  result: MatchResult | null;
  error: string | null;
}

export default function MatchResultPanel({
  result,
  error,
}: MatchResultPanelProps) {
  if (!error && !result) {
    return null;
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div
            className={`rounded-lg border p-4 ${
              result.overallEligible
                ? "border-green-200 bg-green-50"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <p
              className={`font-semibold ${
                result.overallEligible
                  ? "text-green-800"
                  : "text-yellow-800"
              }`}
            >
              {result.message}
            </p>
          </div>

          <div className="space-y-2">
            {result.results.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border p-4"
              >
                <span
                  aria-label={item.eligible ? "자격 충족" : "자격 미충족"}
                  className={`mt-0.5 shrink-0 text-lg ${
                    item.eligible ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {item.eligible ? "O" : "X"}
                </span>
                <div>
                  <p className="font-medium">{item.criterion}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            * 본 결과는 참고용이며 법적 효력이 없습니다. 정확한 자격
            여부는 청약홈에서 확인해주세요.
          </p>
        </div>
      )}
    </>
  );
}
