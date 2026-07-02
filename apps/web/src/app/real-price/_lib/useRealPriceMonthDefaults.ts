"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  buildMonthOptions,
  buildRealPriceMonthState,
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
  const [dealYmd, setDealYmd] = useState("");
  const [trendFromMonth, setTrendFromMonth] = useState("");
  const [trendToMonth, setTrendToMonth] = useState("");

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
