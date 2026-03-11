import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PendingOrder {
  id: string;
  user_id: string;
  stock_symbol: string;
  order_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  status: string;
  created_at: string;
  profiles?: { full_name: string; email: string };
}

export function usePendingOrders() {
  return useQuery({
    queryKey: ['admin', 'pending-orders'],
    queryFn: async (): Promise<PendingOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ['admin', 'all-orders'],
    queryFn: async (): Promise<PendingOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useExecuteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Get the order details
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) throw new Error('Order not found');
      if (order.status !== 'pending') throw new Error('Order is not pending');

      // Update order status to executed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'executed', executed_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // For buy orders, update/create portfolio entry
      if (order.order_type === 'buy') {
        // Check if user already holds this stock
        const { data: existing } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', order.user_id)
          .eq('stock_symbol', order.stock_symbol)
          .single();

        if (existing) {
          // Update existing holding - recalculate avg price
          const totalQty = existing.quantity + order.quantity;
          const totalCost = (existing.quantity * existing.avg_buy_price) + (order.quantity * order.price);
          const newAvg = totalCost / totalQty;

          const { error } = await supabase
            .from('portfolio')
            .update({ quantity: totalQty, avg_buy_price: newAvg, total_invested: totalCost })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Create new holding
          const { error } = await supabase.from('portfolio').insert({
            user_id: order.user_id,
            stock_symbol: order.stock_symbol,
            quantity: order.quantity,
            avg_buy_price: order.price,
            total_invested: order.quantity * order.price,
          });

          if (error) throw error;
        }
      } else if (order.order_type === 'sell') {
        // For sell orders, reduce portfolio quantity
        const { data: existing } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', order.user_id)
          .eq('stock_symbol', order.stock_symbol)
          .single();

        if (existing) {
          const newQty = existing.quantity - order.quantity;
          if (newQty <= 0) {
            await supabase.from('portfolio').delete().eq('id', existing.id);
          } else {
            await supabase.from('portfolio').update({ quantity: newQty }).eq('id', existing.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
