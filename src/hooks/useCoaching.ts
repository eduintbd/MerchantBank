import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import { evaluateCoaching } from '@/services/coachingEngine';
import type { CoachingContext } from '@/services/coachingEngine';
import type { CoachingEvent, DemoOrder, DemoPosition } from '@/types/demo';

// ── Query: Fetch undismissed coaching events ──

export function useCoachingEvents() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['coaching-events', demoAccount?.id],
    queryFn: async (): Promise<CoachingEvent[]> => {
      if (!demoAccount) return [];

      const { data, error } = await supabase
        .from('coaching_events')
        .select('*')
        .eq('demo_account_id', demoAccount.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CoachingEvent[];
    },
    enabled: !!demoAccount,
  });
}

// ── Mutation: Dismiss a coaching event ──

export function useDismissCoaching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('coaching_events')
        .update({ is_dismissed: true })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-events'] });
    },
  });
}

// ── Mutation: Evaluate coaching rules and insert new events ──

export function useEvaluateCoaching() {
  const { demoAccount } = useDemo();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lastAction?: string) => {
      if (!demoAccount) throw new Error('No demo account');

      // Fetch current state for coaching context
      const [ordersRes, positionsRes, tradesRes] = await Promise.all([
        supabase
          .from('demo_orders')
          .select('*')
          .eq('demo_account_id', demoAccount.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('demo_positions')
          .select('*')
          .eq('demo_account_id', demoAccount.id),
        supabase
          .from('demo_trades')
          .select('id')
          .eq('demo_account_id', demoAccount.id),
      ]);

      const orders = (ordersRes.data || []) as DemoOrder[];
      const positions = (positionsRes.data || []) as DemoPosition[];
      const totalFills = tradesRes.data?.length || 0;
      const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

      // Build coaching context
      const context: CoachingContext = {
        totalOrders: orders.length,
        totalFills,
        recentOrders: orders.slice(0, 50),
        positions,
        availableCash: demoAccount.available_cash,
        startingCash: demoAccount.starting_cash,
        realizedPnl: demoAccount.realized_pnl,
        unrealizedPnl: demoAccount.unrealized_pnl,
        cancelledCount,
        lastAction,
      };

      // Evaluate rules
      const triggeredRules = evaluateCoaching(context);
      if (triggeredRules.length === 0) return [];

      // Check which triggers already exist (avoid duplicates for same trigger on same day)
      const today = new Date().toISOString().split('T')[0];
      const { data: existingEvents } = await supabase
        .from('coaching_events')
        .select('trigger_type')
        .eq('demo_account_id', demoAccount.id)
        .gte('created_at', today + 'T00:00:00Z');

      const existingTriggers = new Set(
        (existingEvents || []).map(e => e.trigger_type)
      );

      // Insert only new events
      const newEvents = triggeredRules
        .filter(rule => !existingTriggers.has(rule.trigger))
        .map(rule => ({
          demo_account_id: demoAccount.id,
          trigger_type: rule.trigger,
          title: rule.title,
          message: rule.message,
          severity: rule.severity,
          lesson_id: null,
          lesson_title: rule.lessonHint || null,
          is_dismissed: false,
        }));

      if (newEvents.length > 0) {
        const { error } = await supabase
          .from('coaching_events')
          .insert(newEvents);
        if (error) throw error;
      }

      return newEvents;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-events'] });
    },
  });
}
