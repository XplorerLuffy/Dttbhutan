"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CurrencyCode, DEFAULT_CURRENCY } from "@/lib/currency";

const STORAGE_KEY = "droelma-currency";

const CurrencyContext = createContext<{
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
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
    <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
