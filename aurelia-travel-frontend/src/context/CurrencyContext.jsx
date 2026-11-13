import React, { useMemo, useState } from 'react';
import { CurrencyContext, CURRENCIES, formatMoney } from './currencyCore';

const STORAGE_KEY = 'aurelia.currency';

const readSaved = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return CURRENCIES[saved] ? saved : 'USD';
  } catch {
    return 'USD';
  }
};

/** Remembers the viewer's preferred display currency (USD or LKR). */
export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(readSaved);

  const value = useMemo(() => ({
    currency,
    setCurrency: (next) => {
      if (!CURRENCIES[next]) return;
      setCurrencyState(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage blocked: keep in memory */ }
    },
    format: (usd) => formatMoney(usd, currency)
  }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

/** Small USD | LKR segmented switch. */
export function CurrencyToggle({ className = '' }) {
  return (
    <CurrencyContext.Consumer>
      {({ currency, setCurrency }) => (
        <div role="group" aria-label="Display currency" className={`inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${className}`}>
          {Object.keys(CURRENCIES).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={currency === code}
              onClick={() => setCurrency(code)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                currency === code
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      )}
    </CurrencyContext.Consumer>
  );
}
