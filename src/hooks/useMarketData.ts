import { useQuery } from '@tanstack/react-query';
import { dseSupabase } from '@/lib/supabase';
import type { MarketIndex, LivePrice, MarketStats, MarketSentiment } from '@/types';

interface MarketData {
  indices: MarketIndex[];
  stats: MarketStats;
  sentiment: MarketSentiment;
  advancerRatio: number;
  livePrices: LivePrice[];
  lastUpdated: string;
}

function computeSentiment(ratio: number): MarketSentiment {
  if (ratio >= 0.65) return 'Bull';
  if (ratio >= 0.55) return 'Mild Bull';
  if (ratio >= 0.45) return 'Neutral';
  if (ratio >= 0.35) return 'Mild Bear';
  return 'Bear';
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ['marketData'],
    enabled: !!dseSupabase,
    queryFn: async () => {
      if (!dseSupabase) throw new Error('DSE Supabase not configured');

      const [indicesRes, pricesRes] = await Promise.all([
        dseSupabase.from('market_indices').select('*'),
        dseSupabase.from('live_prices').select('*'),
      ]);

      if (indicesRes.error) throw indicesRes.error;
      if (pricesRes.error) throw pricesRes.error;

      const indices: MarketIndex[] = (indicesRes.data || []).map((r: any) => ({
        index_name: r.index_name,
        value: r.value,
        change: r.change,
        change_pct: r.change_pct,
        scraped_at: r.scraped_at,
      }));

      const prices: LivePrice[] = (pricesRes.data || []).map((r: any) => ({
        symbol: r.symbol,
        ltp: r.ltp,
        high: r.high,
        low: r.low,
        open: r.open,
        close_prev: r.close_prev,
        change: r.change,
        change_pct: r.change_pct,
        volume: r.volume,
        value_traded: r.value_traded,
        trades: r.trades,
        scraped_at: r.scraped_at,
      }));

      let totalVolume = 0, totalValue = 0, totalTrades = 0;
      let advancers = 0, decliners = 0, unchanged = 0;

      for (const p of prices) {
        totalVolume += p.volume || 0;
        totalValue += p.value_traded || 0;
        totalTrades += p.trades || 0;
        if (p.change > 0) advancers++;
        else if (p.change < 0) decliners++;
        else unchanged++;
      }

      const totalStocks = prices.length;
      const advancerRatio = totalStocks > 0 ? advancers / totalStocks : 0.5;

      return {
        indices,
        stats: { totalVolume, totalValue, totalTrades, advancers, decliners, unchanged, totalStocks },
        sentiment: computeSentiment(advancerRatio),
        advancerRatio,
        livePrices: prices,
        lastUpdated: prices[0]?.scraped_at || '',
      };
    },
    refetchInterval: 30000,
  });
}
