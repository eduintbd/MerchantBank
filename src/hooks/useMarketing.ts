import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Referral, Commission, MarketingSummary } from '@/types';

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async (): Promise<Referral[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCommissions() {
  return useQuery({
    queryKey: ['commissions'],
    queryFn: async (): Promise<Commission[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useMarketingSummary() {
  return useQuery({
    queryKey: ['marketing-summary'],
    queryFn: async (): Promise<MarketingSummary> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      const { data: commissions } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', user.id);

      const totalCommission = (commissions || [])
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);

      const pendingCommission = (commissions || [])
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);

      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      return {
        total_referrals: (referrals || []).length,
        active_referrals: (referrals || []).filter(r => r.status === 'active' || r.status === 'qualified').length,
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        referral_code: profile?.referral_code || '',
      };
    },
  });
}
