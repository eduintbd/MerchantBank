import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dseSupabase } from '@/lib/supabase';
import type { PortfolioItem, PortfolioSummary } from '@/types';

const STORAGE_KEY = 'abaci_local_portfolio';

export interface LocalHolding {
  stock_symbol: string;
  quantity: number;
  avg_buy_price: number;
}

function loadHoldings(): LocalHolding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: LocalHolding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function useLocalPortfolio() {
  const [holdings, setHoldings] = useState<LocalHolding[]>(loadHoldings);

  // Sync state → localStorage
  useEffect(() => {
    saveHoldings(holdings);
  }, [holdings]);

  const addHolding = useCallback((h: LocalHolding) => {
    setHoldings(prev => {
      const existing = prev.find(p => p.stock_symbol === h.stock_symbol);
      if (existing) {
        // Weighted average price
        const totalQty = existing.quantity + h.quantity;
        const avgPrice = (existing.quantity * existing.avg_buy_price + h.quantity * h.avg_buy_price) / totalQty;
        return prev.map(p => p.stock_symbol === h.stock_symbol ? { ...p, quantity: totalQty, avg_buy_price: avgPrice } : p);
      }
      return [...prev, h];
    });
  }, []);

  const removeHolding = useCallback((symbol: string) => {
    setHoldings(prev => prev.filter(p => p.stock_symbol !== symbol));
  }, []);

  const clearAll = useCallback(() => {
    setHoldings([]);
  }, []);

  return { holdings, addHolding, removeHolding, clearAll };
}

/** Enriches local holdings with live prices from DSE */
export function useLocalPortfolioEnriched() {
  const { holdings, addHolding, removeHolding, clearAll } = useLocalPortfolio();

  const query = useQuery<PortfolioSummary>({
    queryKey: ['localPortfolio', holdings],
    queryFn: async (): Promise<PortfolioSummary> => {
      const empty: PortfolioSummary = { total_invested: 0, current_value: 0, total_profit_loss: 0, total_profit_loss_percent: 0, total_stocks: 0, items: [] };
      if (holdings.length === 0) return empty;

      let priceMap = new Map<string, number>();
      let nameMap = new Map<string, string>();

      if (dseSupabase) {
        const symbols = holdings.map(h => h.stock_symbol);
        const [pricesRes, stocksRes] = await Promise.all([
          dseSupabase.from('live_prices').select('symbol, ltp').in('symbol', symbols),
          dseSupabase.from('stocks').select('symbol, company_name').in('symbol', symbols),
        ]);
        for (const p of pricesRes.data || []) priceMap.set(p.symbol, p.ltp);
        for (const s of stocksRes.data || []) nameMap.set(s.symbol, s.company_name);
      }

      const items: PortfolioItem[] = holdings.map((h, i) => {
        const currentPrice = priceMap.get(h.stock_symbol) || 0;
        const currentValue = h.quantity * currentPrice;
        const totalInvested = h.quantity * h.avg_buy_price;
        return {
          id: `local-${i}`,
          user_id: 'local',
          stock_id: h.stock_symbol,
          stock_symbol: h.stock_symbol,
          company_name: nameMap.get(h.stock_symbol) || h.stock_symbol,
          quantity: h.quantity,
          avg_buy_price: h.avg_buy_price,
          current_price: currentPrice,
          total_invested: totalInvested,
          current_value: currentValue,
          profit_loss: currentValue - totalInvested,
          profit_loss_percent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        };
      });

      const totalInvested = items.reduce((s, i) => s + i.total_invested, 0);
      const currentValue = items.reduce((s, i) => s + i.current_value, 0);

      return {
        total_invested: totalInvested,
        current_value: currentValue,
        total_profit_loss: currentValue - totalInvested,
        total_profit_loss_percent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        total_stocks: items.length,
        items,
      };
    },
    refetchInterval: 30000,
  });

  return { ...query, addHolding, removeHolding, clearAll, holdings };
}
