import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { LessonTask, UserLessonTask, ScenarioMission, MissionStep } from '@/types/demo';

// ── Query: Fetch lesson tasks for a specific lesson ──

export function useLessonTasks(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-tasks', lessonId],
    queryFn: async (): Promise<LessonTask[]> => {
      if (!lessonId) return [];

      const { data, error } = await supabase
        .from('lesson_tasks')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order');

      if (error) throw error;
      return (data || []) as LessonTask[];
    },
    enabled: !!lessonId,
  });
}

// ── Query: Fetch user's completed lesson tasks ──

export function useUserLessonTasks() {
  return useQuery({
    queryKey: ['user-lesson-tasks'],
    queryFn: async (): Promise<UserLessonTask[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_lesson_tasks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as UserLessonTask[];
    },
  });
}

// ── Mutation: Mark a lesson task as complete ──

export function useCompleteLessonTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonTaskId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_lesson_tasks')
        .upsert({
          user_id: user.id,
          lesson_task_id: lessonTaskId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_task_id' })
        .select()
        .single();

      if (error) throw error;
      return data as UserLessonTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lesson-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['readiness-score'] });
    },
  });
}

// ── Hardcoded scenario missions with completion status from DB ──

const SCENARIO_MISSIONS: Omit<ScenarioMission, 'is_completed' | 'progress'>[] = [
  {
    id: 'mission-first-buy',
    title: 'Your First Stock Purchase',
    description: 'Learn the basics by buying your first stock on the demo exchange.',
    steps: [
      { id: 'step-1a', description: 'Browse the stock list and pick a company', action_type: 'browse_stocks', is_completed: false },
      { id: 'step-1b', description: 'Place a market BUY order for at least 10 shares', action_type: 'place_buy_order', is_completed: false },
      { id: 'step-1c', description: 'Check your portfolio to see your new holding', action_type: 'view_portfolio', is_completed: false },
      { id: 'step-1d', description: 'Review the cash ledger entry for the trade', action_type: 'view_cash_ledger', is_completed: false },
    ],
    xp_reward: 100,
    difficulty: 'beginner',
  },
  {
    id: 'mission-limit-order',
    title: 'Mastering Limit Orders',
    description: 'Understand price control by placing and managing limit orders.',
    steps: [
      { id: 'step-2a', description: 'Place a LIMIT BUY order below the current market price', action_type: 'place_limit_buy', is_completed: false },
      { id: 'step-2b', description: 'Observe the order sitting in "queued" status', action_type: 'view_queued_order', is_completed: false },
      { id: 'step-2c', description: 'Cancel the unfilled limit order', action_type: 'cancel_order', is_completed: false },
      { id: 'step-2d', description: 'Place a new limit order that fills successfully', action_type: 'limit_order_filled', is_completed: false },
    ],
    xp_reward: 150,
    difficulty: 'beginner',
  },
  {
    id: 'mission-sell-profit',
    title: 'Taking Profits',
    description: 'Learn when and how to sell a position for a profit.',
    steps: [
      { id: 'step-3a', description: 'Identify a holding with positive unrealized P&L', action_type: 'identify_profit', is_completed: false },
      { id: 'step-3b', description: 'Place a SELL order for part of the position', action_type: 'place_sell_order', is_completed: false },
      { id: 'step-3c', description: 'Check realized P&L in the reports section', action_type: 'view_pnl_report', is_completed: false },
      { id: 'step-3d', description: 'Review trading charges on the trade', action_type: 'view_charges', is_completed: false },
    ],
    xp_reward: 200,
    difficulty: 'intermediate',
  },
  {
    id: 'mission-diversify',
    title: 'Building a Diversified Portfolio',
    description: 'Spread your risk by investing across multiple sectors.',
    steps: [
      { id: 'step-4a', description: 'Buy stocks from at least 3 different sectors', action_type: 'buy_multi_sector', is_completed: false },
      { id: 'step-4b', description: 'Ensure no single stock exceeds 40% of portfolio value', action_type: 'check_concentration', is_completed: false },
      { id: 'step-4c', description: 'Review your sector breakdown in portfolio summary', action_type: 'view_sector_breakdown', is_completed: false },
    ],
    xp_reward: 250,
    difficulty: 'intermediate',
  },
  {
    id: 'mission-eod-replay',
    title: 'End-of-Day Settlement',
    description: 'Experience the EOD process that real brokerages run every day.',
    steps: [
      { id: 'step-5a', description: 'Place at least 2 trades during the session', action_type: 'place_multiple_trades', is_completed: false },
      { id: 'step-5b', description: 'Run the EOD process', action_type: 'run_eod', is_completed: false },
      { id: 'step-5c', description: 'Review your daily statement', action_type: 'view_statement', is_completed: false },
      { id: 'step-5d', description: 'Check how expired orders were handled', action_type: 'check_expired_orders', is_completed: false },
    ],
    xp_reward: 300,
    difficulty: 'intermediate',
  },
  {
    id: 'mission-risk-mgmt',
    title: 'Risk Management Challenge',
    description: 'Complete a full trading cycle while maintaining proper risk discipline.',
    steps: [
      { id: 'step-6a', description: 'Keep total portfolio loss under 5% of starting capital', action_type: 'maintain_loss_limit', is_completed: false },
      { id: 'step-6b', description: 'Avoid all trading mistakes for 5 consecutive trades', action_type: 'avoid_mistakes', is_completed: false },
      { id: 'step-6c', description: 'Achieve positive realized P&L on at least one position', action_type: 'positive_pnl', is_completed: false },
      { id: 'step-6d', description: 'Complete 3 EOD cycles with a growing portfolio value', action_type: 'growing_portfolio', is_completed: false },
    ],
    xp_reward: 500,
    difficulty: 'advanced',
  },
];

export function useScenarioMissions() {
  return useQuery({
    queryKey: ['scenario-missions'],
    queryFn: async (): Promise<ScenarioMission[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return SCENARIO_MISSIONS.map(m => ({ ...m, is_completed: false, progress: 0 }));

      // Fetch completed tasks to determine step completion
      const { data: completedTasks } = await supabase
        .from('user_lesson_tasks')
        .select('lesson_task_id')
        .eq('user_id', user.id)
        .eq('completed', true);

      const completedSet = new Set(
        (completedTasks || []).map(t => t.lesson_task_id)
      );

      return SCENARIO_MISSIONS.map(mission => {
        const steps: MissionStep[] = mission.steps.map(step => ({
          ...step,
          is_completed: completedSet.has(step.id),
        }));

        const completedSteps = steps.filter(s => s.is_completed).length;
        const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

        return {
          ...mission,
          steps,
          is_completed: completedSteps === steps.length,
          progress,
        };
      });
    },
  });
}
