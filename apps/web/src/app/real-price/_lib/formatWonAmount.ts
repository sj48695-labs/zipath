export function formatWonAmount(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const remainder = value % 10000;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${remainder.toLocaleString("ko-KR")}만원`;
  }

  return `${value.toLocaleString("ko-KR")}만원`;
}
