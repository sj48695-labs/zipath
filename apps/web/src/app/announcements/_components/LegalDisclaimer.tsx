interface LegalDisclaimerProps {
  className?: string;
}

export default function LegalDisclaimer({
  className = "",
}: LegalDisclaimerProps) {
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`.trim()}
    >
      <p className="font-medium">참고용이며 법적 효력 없음</p>
      <p className="mt-1">
        본 정보는 참고용이며 법적 효력이 없습니다. 정확한 내용은 청약홈 원문을
        확인해주세요.
      </p>
    </div>
  );
}
