import { useQuery } from '@tanstack/react-query';
import { dseSupabase } from '@/lib/supabase';

/**
 * Fetch price history from DSE portal price_history table.
 * Columns: id, symbol, trade_date, open, high, low, close, volume, value_traded
 * NOTE: No 'trades' column exists in price_history — only in live_prices.
 */
export function useExtendedPriceHistory(symbol?: string, period: string = '3M') {
  return useQuery({
    queryKey: ['extendedPriceHistory', symbol, period],
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
        .select('trade_date, open, high, low, close, volume, value_traded')
        .eq('symbol', symbol)
        .gte('trade_date', fromDate.toISOString().split('T')[0])
        .order('trade_date', { ascending: true });

      if (error) {
        console.error('price_history fetch error:', error.message);
        return [];
      }

      // Filter out holiday/bad data:
      // 1. Null OHLC = scraper ran on holiday with no data
      // 2. Exact duplicate OHLCV as previous row = scraper copied stale data on a closed day
      const clean = (data || [])
        .filter((bar: any) => bar.open != null && bar.high != null && bar.low != null && bar.close != null)
        .map((bar: any) => ({
          ...bar,
          open: bar.open ?? 0,
          high: bar.high ?? 0,
          low: bar.low ?? 0,
          close: bar.close ?? 0,
          volume: bar.volume ?? 0,
          value_traded: bar.value_traded ?? 0,
        }));

      // Remove consecutive duplicates (holiday copies)
      return clean.filter((bar: any, i: number) => {
        if (i === 0) return true;
        const prev = clean[i - 1];
        return !(
          bar.open === prev.open &&
          bar.high === prev.high &&
          bar.low === prev.low &&
          bar.close === prev.close &&
          bar.volume === prev.volume
        );
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch similar stocks in the same sector from DSE portal.
 * Uses: stocks (symbol, company_name, sector) + live_prices (ltp, change_pct, volume)
 */
export function useSimilarStocks(symbol?: string, sector?: string) {
  return useQuery({
    queryKey: ['similarStocks', symbol, sector],
    enabled: !!symbol && !!sector,
    queryFn: async () => {
      if (!dseSupabase || !symbol || !sector) return [];

      try {
        const { data: sectorStocks } = await dseSupabase
          .from('stocks')
          .select('symbol, company_name, sector')
          .eq('sector', sector)
          .eq('is_active', true)
          .neq('symbol', symbol)
          .limit(30);

        if (!sectorStocks || sectorStocks.length === 0) return [];

        const symbols = sectorStocks.map((s: any) => s.symbol);
        const [pricesRes, currentRes] = await Promise.all([
          dseSupabase.from('live_prices').select('symbol, ltp, change_pct, volume').in('symbol', symbols),
          dseSupabase.from('live_prices').select('change_pct, ltp').eq('symbol', symbol).single(),
        ]);

        if (!pricesRes.data) return [];

        const priceMap = new Map<string, any>();
        for (const p of pricesRes.data) priceMap.set(p.symbol, p);

        const currentChangePct = currentRes.data?.change_pct || 0;
        const currentLtp = currentRes.data?.ltp || 0;

        return sectorStocks
          .map((s: any) => {
            const p = priceMap.get(s.symbol);
            if (!p || p.ltp <= 0) return null;
            const pctDiff = Math.abs((p.change_pct || 0) - currentChangePct);
            const priceDiff = currentLtp > 0 ? Math.abs(p.ltp - currentLtp) / currentLtp : 0;
            const matchScore = Math.max(90, 99.9 - pctDiff * 2 - priceDiff * 5);
            return {
              symbol: s.symbol,
              company_name: s.company_name,
              last_price: p.ltp,
              change_percent: p.change_pct || 0,
              volume: p.volume || 0,
              matchScore: parseFloat(matchScore.toFixed(2)),
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.matchScore - a.matchScore)
          .slice(0, 8);
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });
}
