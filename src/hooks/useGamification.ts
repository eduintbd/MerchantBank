import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UserXp {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  xp_reward: number;
  requirement?: string;
  is_earned?: boolean;
  earned_at?: string;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_xp: number;
  level: number;
  rank: number;
}

export function useUserXp() {
  return useQuery({
    queryKey: ['user-xp'],
    queryFn: async (): Promise<UserXp | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch all achievements
      const { data: achievements, error: achError } = await supabase
        .from('achievements')
        .select('*')
        .order('xp_reward', { ascending: true });

      if (achError) throw achError;

      // Fetch user's earned achievements
      let earnedMap = new Map<string, string>();
      if (user) {
        const { data: earned } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', user.id);
        for (const e of earned || []) {
          earnedMap.set(e.achievement_id, e.earned_at);
        }
      }

      return (achievements || []).map((a: any): Achievement => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        xp_reward: a.xp_reward || 0,
        requirement: a.requirement,
        is_earned: earnedMap.has(a.id),
        earned_at: earnedMap.get(a.id),
      }));
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*, profiles!user_xp_user_id_fkey(full_name, avatar_url)')
        .order('total_xp', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((entry: any, index: number): LeaderboardEntry => ({
        user_id: entry.user_id,
        display_name: entry.profiles?.full_name || 'Anonymous',
        avatar_url: entry.profiles?.avatar_url,
        total_xp: entry.total_xp || 0,
        level: entry.level || 1,
        rank: index + 1,
      }));
    },
  });
}
