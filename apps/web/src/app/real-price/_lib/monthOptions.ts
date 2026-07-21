export interface MonthOption {
  value: string;
  label: string;
}

export interface RealPriceMonthState {
  dealYmd: string;
  trendFromMonth: string;
  trendToMonth: string;
}

export function getInitialRealPriceMonthState(): RealPriceMonthState {
  return {
    dealYmd: "",
    trendFromMonth: "",
    trendToMonth: "",
  };
}

export function buildMonthOptions(referenceDate: Date): MonthOption[] {
  const options: MonthOption[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const value = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    options.push({ value, label });
  }
  return options;
}

export function buildRealPriceMonthState(
  monthOptions: MonthOption[],
): RealPriceMonthState {
  const initialMonthState = getInitialRealPriceMonthState();
  const dealYmd = monthOptions[0]?.value ?? initialMonthState.dealYmd;
  const trendToMonth = monthOptions[0]?.value ?? initialMonthState.trendToMonth;
  const trendFromMonth = monthOptions[5]?.value ?? trendToMonth;

  return {
    dealYmd,
    trendFromMonth,
    trendToMonth,
  };
}
