function formatCommaSeparatedNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatWonAmount(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const remainder = value % 10000;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${formatCommaSeparatedNumber(remainder)}만원`;
  }

  return `${formatCommaSeparatedNumber(value)}만원`;
}

export function formatWonAmountOrFallback(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "거래 없음";
  }

  return formatWonAmount(value);
}
