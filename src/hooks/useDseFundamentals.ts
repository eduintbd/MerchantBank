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
  listing_year: number | null;
  week52_high: number;
  week52_low: number;
  authorized_capital?: number;
  free_float?: number;
}

export function useFundamentals(symbol?: string) {
  return useQuery<StockFundamental | null>({
    queryKey: ['fundamentals', symbol],
    enabled: !!symbol,
    queryFn: async () => {
      if (!dseSupabase || !symbol) return null;

      // Fetch fundamentals + live_prices (for 52W high/low) in parallel
      const [fundRes, priceRes] = await Promise.all([
        dseSupabase.from('fundamentals').select('*').eq('symbol', symbol).single(),
        dseSupabase.from('live_prices').select('week_52_high, week_52_low').eq('symbol', symbol).single(),
      ]);

      if (fundRes.error) return null;
      const f = fundRes.data;
      const p = priceRes.data;

      // Extract listing year from listing_date
      let listingYear: number | null = null;
      if (f.listing_date) {
        const y = new Date(f.listing_date).getFullYear();
        if (!isNaN(y)) listingYear = y;
      }

      return {
        symbol: f.symbol,
        market_cap: f.market_cap || 0,
        eps: f.eps || 0,
        pe_ratio: f.pe_ratio || 0,
        nav: f.nav_per_share || 0,
        paid_up_capital: f.paid_up_capital || 0,
        total_shares: f.total_shares || 0,
        face_value: f.face_value || 0,
        listing_year: listingYear,
        week52_high: p?.week_52_high || 0,
        week52_low: p?.week_52_low || 0,
        authorized_capital: f.authorized_capital || undefined,
        free_float: f.free_float || undefined,
      } as StockFundamental;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useAllFundamentals() {
  return useQuery<StockFundamental[]>({
    queryKey: ['allFundamentals'],
    queryFn: async () => {
      if (!dseSupabase) return [];

      const [fundRes, priceRes] = await Promise.all([
        dseSupabase.from('fundamentals').select('*'),
        dseSupabase.from('live_prices').select('symbol, week_52_high, week_52_low'),
      ]);

      if (fundRes.error) return [];
      const priceMap = new Map<string, any>();
      for (const p of priceRes.data || []) priceMap.set(p.symbol, p);

      return (fundRes.data || []).map((f: any): StockFundamental => {
        const p = priceMap.get(f.symbol);
        let listingYear: number | null = null;
        if (f.listing_date) {
          const y = new Date(f.listing_date).getFullYear();
          if (!isNaN(y)) listingYear = y;
        }
        return {
          symbol: f.symbol,
          market_cap: f.market_cap || 0,
          eps: f.eps || 0,
          pe_ratio: f.pe_ratio || 0,
          nav: f.nav_per_share || 0,
          paid_up_capital: f.paid_up_capital || 0,
          total_shares: f.total_shares || 0,
          face_value: f.face_value || 0,
          listing_year: listingYear,
          week52_high: p?.week_52_high || 0,
          week52_low: p?.week_52_low || 0,
        };
      });
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
        .order('period_end', { ascending: false });
      if (error) return [];
      // Map nav_per_share -> nav and extract year from period_end
      return (data || []).map((f: any) => ({
        ...f,
        year: f.year || (f.period_end ? new Date(f.period_end).getFullYear() : null),
        nav: f.nav_per_share ?? f.nav ?? null,
      }));
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
