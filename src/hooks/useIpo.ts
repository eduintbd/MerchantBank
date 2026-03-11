import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Ipo {
  id: string;
  company_name: string;
  symbol?: string;
  sector?: string;
  offer_price: number;
  lot_size: number;
  min_investment?: number;
  total_shares?: number;
  subscription_start: string;
  subscription_end: string;
  status: 'upcoming' | 'open' | 'closed' | 'listed';
  listing_date?: string;
  description?: string;
  created_at: string;
}

interface IpoApplication {
  id: string;
  user_id: string;
  ipo_id: string;
  lots_applied: number;
  amount: number;
  status: 'pending' | 'allotted' | 'not_allotted' | 'refunded';
  created_at: string;
}

export function useIpos(status?: string) {
  return useQuery({
    queryKey: ['ipos', status],
    queryFn: async (): Promise<Ipo[]> => {
      let query = supabase
        .from('ipos')
        .select('*')
        .order('subscription_start', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useIpoDetail(id: string) {
  return useQuery({
    queryKey: ['ipo', id],
    queryFn: async (): Promise<Ipo | null> => {
      const { data, error } = await supabase
        .from('ipos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useApplyIpo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (application: { ipo_id: string; lots_applied: number; amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ipo_applications')
        .insert({
          user_id: user.id,
          ipo_id: application.ipo_id,
          lots_applied: application.lots_applied,
          amount: application.amount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipos'] });
    },
  });
}
