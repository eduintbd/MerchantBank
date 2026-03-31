import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, dseSupabase } from '@/lib/supabase';
import type { Stock, Order, OrderType, PortfolioSummary, PortfolioItem } from '@/types';

// Fetch live stocks from DSE Portal Supabase (stocks + live_prices)
export function useStocks(search?: string) {
  return useQuery({
    queryKey: ['stocks', search],
    queryFn: async (): Promise<Stock[]> => {
      if (!dseSupabase) return [];

      // Fetch stocks and live_prices in parallel
      let stocksQuery = dseSupabase.from('stocks').select('symbol, company_name, sector, category').eq('is_active', true).order('symbol');
      if (search) {
        stocksQuery = stocksQuery.or(`symbol.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      const [stocksRes, pricesRes] = await Promise.all([
        stocksQuery,
        dseSupabase.from('live_prices').select('*'),
      ]);

      if (stocksRes.error) throw stocksRes.error;
      if (pricesRes.error) throw pricesRes.error;

      // Index prices by symbol for fast lookup
      const priceMap = new Map<string, any>();
      for (const p of pricesRes.data || []) {
        priceMap.set(p.symbol, p);
      }

      // Merge stocks with live prices
      return (stocksRes.data || []).map((s: any): Stock => {
        const p = priceMap.get(s.symbol);
        return {
          id: s.symbol,
          symbol: s.symbol,
          company_name: s.company_name,
          sector: s.sector || '',
          last_price: p?.ltp || 0,
          change: p?.change || 0,
          change_percent: p?.change_pct || 0,
          volume: p?.volume || 0,
          high: p?.high || 0,
          low: p?.low || 0,
          open: p?.open || 0,
          close: p?.close_prev || 0,
          market_cap: undefined,
          trades: p?.trades || 0,
          value_traded: p?.value_traded || 0,
          week_52_high: p?.week_52_high || 0,
          week_52_low: p?.week_52_low || 0,
          updated_at: p?.scraped_at || '',
        };
      });
    },
    refetchInterval: 30000,
  });
}

// Fetch single stock from DSE Portal
export function useStock(symbol: string) {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: async (): Promise<Stock | null> => {
      if (!dseSupabase) return null;

      const [stockRes, priceRes] = await Promise.all([
        dseSupabase.from('stocks').select('symbol, company_name, sector, category').eq('symbol', symbol).single(),
        dseSupabase.from('live_prices').select('*').eq('symbol', symbol).single(),
      ]);

      if (stockRes.error) throw stockRes.error;
      const s = stockRes.data;
      const p = priceRes.data;

      return {
        id: s.symbol,
        symbol: s.symbol,
        company_name: s.company_name,
        sector: s.sector || '',
        last_price: p?.ltp || 0,
        change: p?.change || 0,
        change_percent: p?.change_pct || 0,
        volume: p?.volume || 0,
        high: p?.high || 0,
        low: p?.low || 0,
        open: p?.open || 0,
        close: p?.close_prev || 0,
        market_cap: undefined,
        trades: p?.trades || 0,
        value_traded: p?.value_traded || 0,
        week_52_high: p?.week_52_high || 0,
        week_52_low: p?.week_52_low || 0,
        updated_at: p?.scraped_at || '',
      };
    },
    enabled: !!symbol,
  });
}

export function useOrders(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      stock_symbol: string;
      order_type: OrderType;
      quantity: number;
      price: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('orders').insert({
        user_id: user.id,
        stock_symbol: order.stock_symbol,
        order_type: order.order_type,
        quantity: order.quantity,
        price: order.price,
        total_amount: order.quantity * order.price,
        status: 'pending',
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function usePortfolio(userId?: string) {
  return useQuery({
    queryKey: ['portfolio', userId],
    queryFn: async (): Promise<PortfolioSummary> => {
      const emptyPortfolio: PortfolioSummary = { total_invested: 0, current_value: 0, total_profit_loss: 0, total_profit_loss_percent: 0, total_stocks: 0, items: [] };

      const { data: { user } } = await supabase.auth.getUser();
      const id = userId || user?.id;
      if (!id) return emptyPortfolio;

      // Fetch portfolio holdings from Hero Supabase
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', id);

      if (error) return emptyPortfolio;
      if (!data || data.length === 0) return emptyPortfolio;

      // Fetch live prices + stock names from DSE Portal
      let priceMap = new Map<string, any>();
      let nameMap = new Map<string, string>();
      if (dseSupabase) {
        const symbols = data.map((item: any) => item.stock_symbol);
        const [pricesRes, stocksRes] = await Promise.all([
          dseSupabase.from('live_prices').select('symbol, ltp').in('symbol', symbols),
          dseSupabase.from('stocks').select('symbol, company_name').in('symbol', symbols),
        ]);
        for (const p of pricesRes.data || []) priceMap.set(p.symbol, p);
        for (const s of stocksRes.data || []) nameMap.set(s.symbol, s.company_name);
      }

      const items: PortfolioItem[] = data.map((item: any) => {
        const currentPrice = priceMap.get(item.stock_symbol)?.ltp || 0;
        const currentValue = item.quantity * currentPrice;
        const totalInvested = item.quantity * item.avg_buy_price;
        return {
          id: item.id,
          user_id: item.user_id,
          stock_id: item.stock_symbol,
          stock_symbol: item.stock_symbol,
          company_name: nameMap.get(item.stock_symbol) || item.stock_symbol,
          quantity: item.quantity,
          avg_buy_price: item.avg_buy_price,
          current_price: currentPrice,
          total_invested: totalInvested,
          current_value: currentValue,
          profit_loss: currentValue - totalInvested,
          profit_loss_percent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        };
      });

      const totalInvested = items.reduce((sum, i) => sum + i.total_invested, 0);
      const currentValue = items.reduce((sum, i) => sum + i.current_value, 0);

      return {
        total_invested: totalInvested,
        current_value: currentValue,
        total_profit_loss: currentValue - totalInvested,
        total_profit_loss_percent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        total_stocks: items.length,
        items,
      };
    },
  });
}
