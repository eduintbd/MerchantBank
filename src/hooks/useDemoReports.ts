import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import { detectMistakes } from '@/services/mistakeDetector';
import type {
  DemoTrade,
  DemoOrder,
  DemoPosition,
  TradeReport,
  PnlReport,
  PerformancePoint,
  TradingMistake,
} from '@/types/demo';

// ── Query: Fetch trade history with optional date range ──

export function useTradeHistory(dateRange?: { from: string; to: string }) {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-trades', demoAccount?.id, dateRange?.from, dateRange?.to],
    queryFn: async (): Promise<TradeReport[]> => {
      if (!demoAccount) return [];

      let query = supabase
        .from('demo_trades')
        .select('*')
        .eq('demo_account_id', demoAccount.id)
        .order('trade_time', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('trade_time', dateRange.from + 'T00:00:00Z');
      }
      if (dateRange?.to) {
        query = query.lte('trade_time', dateRange.to + 'T23:59:59Z');
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((t: any): TradeReport => ({
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        price: t.price,
        gross_amount: t.gross_amount,
        charges: t.total_charges,
        net_amount: t.net_amount,
        trade_time: t.trade_time,
      }));
    },
    enabled: !!demoAccount,
  });
}

// ── Query: Aggregate P&L by symbol from positions ──

export function usePnlReport() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-pnl-report', demoAccount?.id],
    queryFn: async (): Promise<PnlReport[]> => {
      if (!demoAccount) return [];

      // Get positions for P&L data
      const { data: positions, error: posError } = await supabase
        .from('demo_positions')
        .select('*')
        .eq('demo_account_id', demoAccount.id);

      if (posError) throw posError;

      // Get charges grouped by symbol (via trades)
      const { data: trades, error: tradeError } = await supabase
        .from('demo_trades')
        .select('symbol, total_charges')
        .eq('demo_account_id', demoAccount.id);

      if (tradeError) throw tradeError;

      // Aggregate charges by symbol
      const chargesBySymbol = new Map<string, number>();
      for (const t of trades || []) {
        chargesBySymbol.set(t.symbol, (chargesBySymbol.get(t.symbol) || 0) + Number(t.total_charges));
      }

      return (positions || []).map((pos): PnlReport => {
        const realizedPnl = Number(pos.realized_pnl);
        const unrealizedPnl = Number(pos.unrealized_pnl);
        const totalPnl = realizedPnl + unrealizedPnl;
        const totalCharges = chargesBySymbol.get(pos.symbol) || 0;

        return {
          symbol: pos.symbol,
          realized_pnl: Math.round(realizedPnl * 100) / 100,
          unrealized_pnl: Math.round(unrealizedPnl * 100) / 100,
          total_pnl: Math.round(totalPnl * 100) / 100,
          total_charges: Math.round(totalCharges * 100) / 100,
          net_pnl: Math.round((totalPnl - totalCharges) * 100) / 100,
        };
      });
    },
    enabled: !!demoAccount,
  });
}

// ── Query: Performance trend from EOD results ──

export function usePerformanceTrend() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-performance', demoAccount?.id],
    queryFn: async (): Promise<PerformancePoint[]> => {
      if (!demoAccount) return [];

      const { data: results, error } = await supabase
        .from('eod_account_results')
        .select('*, eod_runs!inner(business_date)')
        .eq('demo_account_id', demoAccount.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (results || []).map((r: any): PerformancePoint => {
        const portfolioValue = Number(r.portfolio_value);
        const summary = r.summary_json as Record<string, any> | null;
        const cash = summary?.closingCash || 0;

        return {
          date: r.eod_runs?.business_date || r.created_at.split('T')[0],
          portfolio_value: portfolioValue,
          cash,
          total_value: portfolioValue,
        };
      });
    },
    enabled: !!demoAccount,
  });
}

// ── Hook: Detect trading mistakes from current orders/trades/positions ──

export function useMistakeLog() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-mistakes', demoAccount?.id],
    queryFn: async (): Promise<TradingMistake[]> => {
      if (!demoAccount) return [];

      const [ordersRes, tradesRes, positionsRes] = await Promise.all([
        supabase
          .from('demo_orders')
          .select('*')
          .eq('demo_account_id', demoAccount.id),
        supabase
          .from('demo_trades')
          .select('*')
          .eq('demo_account_id', demoAccount.id),
        supabase
          .from('demo_positions')
          .select('*')
          .eq('demo_account_id', demoAccount.id),
      ]);

      return detectMistakes({
        orders: (ordersRes.data || []) as DemoOrder[],
        trades: (tradesRes.data || []) as DemoTrade[],
        positions: (positionsRes.data || []) as DemoPosition[],
        startingCash: demoAccount.starting_cash,
      });
    },
    enabled: !!demoAccount,
  });
}
