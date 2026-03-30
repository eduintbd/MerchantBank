import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import type { DemoAccount, LearnerProfile } from '@/types/demo';

// ── Query: Fetch current user's demo account + learner profile ──

export function useDemoAccount() {
  return useQuery({
    queryKey: ['demo-account'],
    queryFn: async (): Promise<{ account: DemoAccount | null; profile: LearnerProfile | null }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [accountRes, profileRes] = await Promise.all([
        supabase.from('demo_accounts').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('learner_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (accountRes.error) throw accountRes.error;
      if (profileRes.error) throw profileRes.error;

      return {
        account: accountRes.data as DemoAccount | null,
        profile: profileRes.data as LearnerProfile | null,
      };
    },
  });
}

// ── Mutation: Create learner profile ──

export function useCreateLearnerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: {
      experience_level: LearnerProfile['experience_level'];
      risk_appetite: LearnerProfile['risk_appetite'];
      learning_goal: string;
      preferred_language: LearnerProfile['preferred_language'];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('learner_profiles')
        .insert({
          user_id: user.id,
          experience_level: profile.experience_level,
          risk_appetite: profile.risk_appetite,
          learning_goal: profile.learning_goal,
          preferred_language: profile.preferred_language,
          readiness_score: 0,
          confidence_score: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LearnerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-account'] });
    },
  });
}

// ── Mutation: Update (save) learner profile ──

export function useSaveLearnerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<
      LearnerProfile,
      'experience_level' | 'risk_appetite' | 'learning_goal' | 'preferred_language' | 'readiness_score' | 'confidence_score'
    >>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('learner_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as LearnerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-account'] });
    },
  });
}
