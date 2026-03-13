import { useQuery } from '@tanstack/react-query';
import { dseSupabase } from '@/lib/supabase';

export interface StockFundamental {
  symbol: string;
  market_cap: number;
  eps: number;
  pe_ratio: number;
  nav: number;
  paid_up_capital: number;
  total_shares: number;
  face_value: number;
  listing_year: number;
  week52_high: number;
  week52_low: number;
}

export function useFundamentals(symbol?: string) {
  return useQuery<StockFundamental | null>({
    queryKey: ['fundamentals', symbol],
    enabled: !!symbol,
    queryFn: async () => {
      if (!dseSupabase || !symbol) return null;
      const { data, error } = await dseSupabase
        .from('fundamentals')
        .select('*')
        .eq('symbol', symbol)
        .single();
      if (error) return null;
      return data as StockFundamental;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useAllFundamentals() {
  return useQuery<StockFundamental[]>({
    queryKey: ['allFundamentals'],
    queryFn: async () => {
      if (!dseSupabase) return [];
      const { data, error } = await dseSupabase.from('fundamentals').select('*');
      if (error) return [];
      return (data || []) as StockFundamental[];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useDividendHistory(symbol?: string) {
  return useQuery({
    queryKey: ['dividends', symbol],
    enabled: !!symbol,
    queryFn: async () => {
      if (!dseSupabase || !symbol) return [];
      const { data, error } = await dseSupabase
        .from('dividend_history')
        .select('*')
        .eq('symbol', symbol)
        .order('year', { ascending: false });
      if (error) return [];
      return data || [];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useFinancialStatements(symbol?: string) {
  return useQuery({
    queryKey: ['financialStatements', symbol],
    enabled: !!symbol,
    queryFn: async () => {
      if (!dseSupabase || !symbol) return [];
      const { data, error } = await dseSupabase
        .from('financial_statements')
        .select('*')
        .eq('symbol', symbol)
        .order('year', { ascending: false });
      if (error) return [];
      return data || [];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function usePriceHistory(symbol?: string, period: string = '3M') {
  return useQuery({
    queryKey: ['priceHistory', symbol, period],
    enabled: !!symbol,
    queryFn: async () => {
      if (!dseSupabase || !symbol) return [];

      const now = new Date();
      let fromDate: Date;
      switch (period) {
        case '1W': fromDate = new Date(now.getTime() - 7 * 86400000); break;
        case '1M': fromDate = new Date(new Date().setMonth(now.getMonth() - 1)); break;
        case '3M': fromDate = new Date(new Date().setMonth(now.getMonth() - 3)); break;
        case '6M': fromDate = new Date(new Date().setMonth(now.getMonth() - 6)); break;
        case '1Y': fromDate = new Date(new Date().setFullYear(now.getFullYear() - 1)); break;
        case '5Y': fromDate = new Date(new Date().setFullYear(now.getFullYear() - 5)); break;
        case 'ALL': fromDate = new Date('2000-01-01'); break;
        default: fromDate = new Date(new Date().setMonth(now.getMonth() - 3));
      }

      const { data, error } = await dseSupabase
        .from('price_history')
        .select('trade_date, open, high, low, close, volume')
        .eq('symbol', symbol)
        .gte('trade_date', fromDate.toISOString().split('T')[0])
        .order('trade_date', { ascending: true });

      if (error) return [];
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
