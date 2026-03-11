import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface InvestorProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  total_return_pct: number;
  followers_count: number;
  is_public: boolean;
  is_followed?: boolean;
  created_at: string;
}

export function useTopInvestors() {
  return useQuery({
    queryKey: ['top-investors'],
    queryFn: async (): Promise<InvestorProfile[]> => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('is_public', true)
        .order('total_return_pct', { ascending: false });

      if (error) throw error;

      // Check follow status for current user
      let followedIds = new Set<string>();
      if (user && data && data.length > 0) {
        const { data: follows } = await supabase
          .from('investor_followers')
          .select('investor_user_id')
          .eq('follower_user_id', user.id);
        followedIds = new Set((follows || []).map((f: any) => f.investor_user_id));
      }

      return (data || []).map((p: any): InvestorProfile => ({
        id: p.id,
        user_id: p.user_id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        bio: p.bio,
        total_return_pct: p.total_return_pct || 0,
        followers_count: p.followers_count || 0,
        is_public: p.is_public,
        is_followed: followedIds.has(p.user_id),
        created_at: p.created_at,
      }));
    },
  });
}

export function useInvestorProfile(userId: string) {
  return useQuery({
    queryKey: ['investor-profile', userId],
    queryFn: async (): Promise<InvestorProfile | null> => {
      const { data, error } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useFollowInvestor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (investorUserId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('investor_followers')
        .insert({
          investor_user_id: investorUserId,
          follower_user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-investors'] });
    },
  });
}

export function useUnfollowInvestor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (investorUserId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('investor_followers')
        .delete()
        .eq('investor_user_id', investorUserId)
        .eq('follower_user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-investors'] });
    },
  });
}
