import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PendingOrder {
  id: string;
  user_id: string;
  stock_id: string;
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
      const { error } = await supabase.rpc('execute_order', { order_id: orderId });
      if (error) throw error;
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
      const { error } = await supabase.rpc('reject_order', { order_id: orderId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
