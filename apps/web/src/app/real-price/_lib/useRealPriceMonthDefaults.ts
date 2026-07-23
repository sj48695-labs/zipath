"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { type RealPriceMonthDefaults, type MonthOption } from "./monthOptions";

interface UseRealPriceMonthDefaultsResult {
  monthOptions: MonthOption[];
  dealYmd: string;
  trendFromMonth: string;
  trendToMonth: string;
  setDealYmd: Dispatch<SetStateAction<string>>;
  setTrendFromMonth: Dispatch<SetStateAction<string>>;
  setTrendToMonth: Dispatch<SetStateAction<string>>;
}

interface UseRealPriceMonthDefaultsInput {
  initialMonthDefaults: RealPriceMonthDefaults;
}

export function useRealPriceMonthDefaults({
  initialMonthDefaults,
}: UseRealPriceMonthDefaultsInput): UseRealPriceMonthDefaultsResult {
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>(
    initialMonthDefaults.monthOptions,
  );
  const [dealYmd, setDealYmd] = useState(initialMonthDefaults.dealYmd);
  const [trendFromMonth, setTrendFromMonth] = useState(
    initialMonthDefaults.trendFromMonth,
  );
  const [trendToMonth, setTrendToMonth] = useState(
    initialMonthDefaults.trendToMonth,
  );

  return {
    monthOptions,
    dealYmd,
    trendFromMonth,
    trendToMonth,
    setDealYmd,
    setTrendFromMonth,
    setTrendToMonth,
  };
}
