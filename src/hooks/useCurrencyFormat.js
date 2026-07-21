import { useCallback } from 'react';
import { useCurrency } from './useCurrency';
import { formatCurrency } from '../utils/format';

export function useCurrencyFormat() {
  const currency = useCurrency();
  return useCallback((amount) => formatCurrency(amount, currency), [currency]);
}
