import { useQuery } from '@tanstack/react-query';
import { dseSupabase } from '@/lib/supabase';

export interface SectorPerf {
  sector: string;
  avgChange: number;
  totalVolume: number;
  totalValue: number;
  stockCount: number;
  advancers: number;
  decliners: number;
}

export function useSectorPerformance() {
  return useQuery<SectorPerf[]>({
    queryKey: ['sectorPerformance'],
    queryFn: async () => {
      if (!dseSupabase) return [];

      const [stocksRes, pricesRes] = await Promise.all([
        dseSupabase.from('stocks').select('symbol, sector').eq('is_active', true),
        dseSupabase.from('live_prices').select('symbol, change_pct, volume, value_traded'),
      ]);

      if (stocksRes.error || pricesRes.error) return [];

      const priceMap = new Map<string, any>();
      for (const p of pricesRes.data || []) priceMap.set(p.symbol, p);

      const sectorMap = new Map<string, SectorPerf>();

      for (const s of stocksRes.data || []) {
        const sector = s.sector || 'Others';
        const p = priceMap.get(s.symbol);
        if (!p) continue;

        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, { sector, avgChange: 0, totalVolume: 0, totalValue: 0, stockCount: 0, advancers: 0, decliners: 0 });
        }
        const sp = sectorMap.get(sector)!;
        sp.avgChange += p.change_pct || 0;
        sp.totalVolume += p.volume || 0;
        sp.totalValue += p.value_traded || 0;
        sp.stockCount++;
        if (p.change_pct > 0) sp.advancers++;
        else if (p.change_pct < 0) sp.decliners++;
      }

      const result: SectorPerf[] = [];
      for (const sp of sectorMap.values()) {
        if (sp.stockCount > 0) sp.avgChange /= sp.stockCount;
        result.push(sp);
      }

      return result.sort((a, b) => b.avgChange - a.avgChange);
    },
    refetchInterval: 60000,
  });
}
