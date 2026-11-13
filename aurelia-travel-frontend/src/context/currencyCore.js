import { createContext, useContext } from 'react';

// All trip prices are stored in USD; LKR is a display conversion.
// Override the rate with VITE_LKR_PER_USD in aurelia-travel-frontend/.env
export const LKR_PER_USD = Number(import.meta.env.VITE_LKR_PER_USD) || 300;

export const CURRENCIES = {
  USD: { code: 'USD', label: 'USD ($)' },
  LKR: { code: 'LKR', label: 'LKR (Rs)' }
};

export const convertFromUSD = (usd, currency) =>
  currency === 'LKR' ? Number(usd || 0) * LKR_PER_USD : Number(usd || 0);

export const convertToUSD = (amount, currency) =>
  currency === 'LKR' ? Number(amount || 0) / LKR_PER_USD : Number(amount || 0);

export const formatMoney = (usd, currency = 'USD') => {
  const value = convertFromUSD(usd, currency);
  if (currency === 'LKR') {
    // Round to the nearest 100 rupees: precise-looking LKR from a USD estimate is misleading
    return `Rs ${(Math.round(value / 100) * 100).toLocaleString('en-LK')}`;
  }
  return `$${Math.round(value).toLocaleString('en-US')}`;
};

export const CurrencyContext = createContext({
  currency: 'USD',
  setCurrency: () => {},
  format: (usd) => formatMoney(usd, 'USD')
});

export const useCurrency = () => useContext(CurrencyContext);
