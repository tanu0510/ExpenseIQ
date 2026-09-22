import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext(null);

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
};

export const CurrencyProvider = ({ children, initialCurrency = 'INR' }) => {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('expenseiq_currency') || initialCurrency;
  });

  const setCurrency = (newCurrency) => {
    if (CURRENCY_SYMBOLS[newCurrency]) {
      setCurrencyState(newCurrency);
      localStorage.setItem('expenseiq_currency', newCurrency);
    }
  };

  const symbol = CURRENCY_SYMBOLS[currency] || '₹';

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    try {
      if (currency === 'INR') {
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return `${symbol}${num.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
