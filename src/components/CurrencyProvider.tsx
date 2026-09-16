"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CurrencyCode, DEFAULT_CURRENCY, RateMap, CLIENT_DEFAULT_RATES } from "@/lib/currency";

const STORAGE_KEY = "droelma-currency";

const CurrencyContext = createContext<{
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: RateMap;
}>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  rates: CLIENT_DEFAULT_RATES,
});

export function CurrencyProvider({
  children,
  rates,
}: {
  children: React.ReactNode;
  /** Current rates, fetched server-side (see getCurrentRates in src/lib/fx.ts). */
  rates: RateMap;
}) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  // Read the viewer's last choice on mount. Wrapped in try/catch since
  // localStorage can throw (private browsing, blocked site data).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (saved) setCurrencyState(saved);
    } catch {
      // ignore
    }
  }, []);

  function setCurrency(c: CurrencyCode) {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignore
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
