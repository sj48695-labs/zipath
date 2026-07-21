"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  buildMonthOptions,
  buildRealPriceMonthState,
  getInitialRealPriceMonthState,
  type MonthOption,
} from "./monthOptions";

interface UseRealPriceMonthDefaultsResult {
  monthOptions: MonthOption[];
  dealYmd: string;
  trendFromMonth: string;
  trendToMonth: string;
  setDealYmd: Dispatch<SetStateAction<string>>;
  setTrendFromMonth: Dispatch<SetStateAction<string>>;
  setTrendToMonth: Dispatch<SetStateAction<string>>;
}

export function useRealPriceMonthDefaults(): UseRealPriceMonthDefaultsResult {
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);
  const initialMonthState = getInitialRealPriceMonthState();
  const [dealYmd, setDealYmd] = useState(initialMonthState.dealYmd);
  const [trendFromMonth, setTrendFromMonth] = useState(
    initialMonthState.trendFromMonth,
  );
  const [trendToMonth, setTrendToMonth] = useState(initialMonthState.trendToMonth);

  useEffect(() => {
    const options = buildMonthOptions(new Date());
    const initialMonthState = buildRealPriceMonthState(options);

    setMonthOptions(options);
    setDealYmd(initialMonthState.dealYmd);
    setTrendFromMonth(initialMonthState.trendFromMonth);
    setTrendToMonth(initialMonthState.trendToMonth);
  }, []);

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
