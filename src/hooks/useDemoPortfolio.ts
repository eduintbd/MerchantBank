import { useQuery } from '@tanstack/react-query';
import { supabase, dseSupabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import type { DemoPosition } from '@/types/demo';

// ── Query: Fetch positions enriched with company name & live price ──

export function useDemoPortfolio() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-portfolio', demoAccount?.id],
    queryFn: async (): Promise<DemoPosition[]> => {
      if (!demoAccount) return [];

      const { data: positions, error } = await supabase
        .from('demo_positions')
        .select('*')
        .eq('demo_account_id', demoAccount.id)
        .gt('quantity', 0);

      if (error) throw error;
      if (!positions || positions.length === 0) return [];

      // Enrich with live market data from DSE
      const symbols = positions.map(p => p.symbol);

      const [stocksRes, pricesRes] = await Promise.all([
        dseSupabase.from('stocks').select('symbol, company_name').in('symbol', symbols),
        dseSupabase.from('live_prices').select('symbol, ltp').in('symbol', symbols),
      ]);

      const nameMap = new Map<string, string>();
      for (const s of stocksRes.data || []) {
        nameMap.set(s.symbol, s.company_name);
      }

      const priceMap = new Map<string, number>();
      for (const p of pricesRes.data || []) {
        priceMap.set(p.symbol, p.ltp);
      }

      return positions.map((pos): DemoPosition => {
        const livePrice = priceMap.get(pos.symbol) || Number(pos.market_price);
        const qty = Number(pos.quantity);
        const avgCost = Number(pos.avg_cost);
        const marketValue = qty * livePrice;
        const unrealizedPnl = (livePrice - avgCost) * qty;

        return {
          ...pos,
          company_name: nameMap.get(pos.symbol) || pos.symbol,
          market_price: livePrice,
          market_value: Math.round(marketValue * 100) / 100,
          unrealized_pnl: Math.round(unrealizedPnl * 100) / 100,
        } as DemoPosition;
      });
    },
    enabled: !!demoAccount,
    refetchInterval: 30000, // Refresh with live prices every 30s
  });
}

// ── Derived Query: Portfolio summary with sector breakdown ──

export interface PortfolioSummaryData {
  totalMarketValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  sectorBreakdown: { sector: string; value: number; percent: number }[];
}

export function useDemoPortfolioSummary() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-portfolio-summary', demoAccount?.id],
    queryFn: async (): Promise<PortfolioSummaryData> => {
      if (!demoAccount) {
        return { totalMarketValue: 0, totalUnrealizedPnl: 0, totalRealizedPnl: 0, sectorBreakdown: [] };
      }

      // Get positions
      const { data: positions, error } = await supabase
        .from('demo_positions')
        .select('*')
        .eq('demo_account_id', demoAccount.id)
        .gt('quantity', 0);

      if (error) throw error;
      if (!positions || positions.length === 0) {
        return { totalMarketValue: 0, totalUnrealizedPnl: 0, totalRealizedPnl: 0, sectorBreakdown: [] };
      }

      // Enrich with live prices and sector info
      const symbols = positions.map(p => p.symbol);
      const [stocksRes, pricesRes] = await Promise.all([
        dseSupabase.from('stocks').select('symbol, sector').in('symbol', symbols),
        dseSupabase.from('live_prices').select('symbol, ltp').in('symbol', symbols),
      ]);

      const sectorMap = new Map<string, string>();
      for (const s of stocksRes.data || []) {
        sectorMap.set(s.symbol, s.sector || 'Unknown');
      }

      const priceMap = new Map<string, number>();
      for (const p of pricesRes.data || []) {
        priceMap.set(p.symbol, p.ltp);
      }

      let totalMarketValue = 0;
      let totalUnrealizedPnl = 0;
      let totalRealizedPnl = 0;
      const sectorValues = new Map<string, number>();

      for (const pos of positions) {
        const livePrice = priceMap.get(pos.symbol) || Number(pos.market_price);
        const qty = Number(pos.quantity);
        const avgCost = Number(pos.avg_cost);
        const mv = qty * livePrice;
        const uPnl = (livePrice - avgCost) * qty;

        totalMarketValue += mv;
        totalUnrealizedPnl += uPnl;
        totalRealizedPnl += Number(pos.realized_pnl);

        const sector = sectorMap.get(pos.symbol) || 'Unknown';
        sectorValues.set(sector, (sectorValues.get(sector) || 0) + mv);
      }

      const sectorBreakdown = Array.from(sectorValues.entries())
        .map(([sector, value]) => ({
          sector,
          value: Math.round(value * 100) / 100,
          percent: totalMarketValue > 0 ? Math.round((value / totalMarketValue) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

      return {
        totalMarketValue: Math.round(totalMarketValue * 100) / 100,
        totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
        totalRealizedPnl: Math.round(totalRealizedPnl * 100) / 100,
        sectorBreakdown,
      };
    },
    enabled: !!demoAccount,
    refetchInterval: 30000,
  });
}
