import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import { detectMistakes } from '@/services/mistakeDetector';
import type {
  ReadinessBreakdown,
  DemoOrder,
  DemoTrade,
  DemoPosition,
} from '@/types/demo';

// ── Score weights ──
const WEIGHT_LESSONS = 30;     // 30 points max
const WEIGHT_QUIZ = 20;        // 20 points max
const WEIGHT_TRADES = 20;      // 20 points max
const WEIGHT_EOD = 15;         // 15 points max
const WEIGHT_MISTAKES = 15;    // 15 points max

const READY_THRESHOLD = 70;
const MIN_TRADES_FOR_FULL = 10;
const MIN_EOD_FOR_FULL = 3;

// ── Query: Compute readiness breakdown ──

export function useReadinessScore() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['readiness-score', demoAccount?.id],
    queryFn: async (): Promise<ReadinessBreakdown> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Lessons completed vs total
      const [coursesRes, progressRes] = await Promise.all([
        supabase.from('courses').select('id, total_lessons'),
        supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true),
      ]);

      const totalLessons = (coursesRes.data || []).reduce((s, c) => s + (c.total_lessons || 0), 0);
      const lessonsCompleted = (progressRes.data || []).length;
      const lessonScore = totalLessons > 0
        ? Math.min((lessonsCompleted / totalLessons) * WEIGHT_LESSONS, WEIGHT_LESSONS)
        : 0;

      // 2. Quiz average score
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('user_id', user.id);

      let quizAvgScore = 0;
      if (quizAttempts && quizAttempts.length > 0) {
        const totalQuizScore = quizAttempts.reduce((s, a) => s + (Number(a.score) || 0), 0);
        quizAvgScore = totalQuizScore / quizAttempts.length;
      }
      const quizScore = Math.min((quizAvgScore / 100) * WEIGHT_QUIZ, WEIGHT_QUIZ);

      // 3. Trades placed
      let tradesPlaced = 0;
      let tradesScore = 0;
      let mistakesAvoided = 0;
      let mistakeScore = WEIGHT_MISTAKES; // Full score if no account

      if (demoAccount) {
        const { data: trades } = await supabase
          .from('demo_trades')
          .select('id')
          .eq('demo_account_id', demoAccount.id);

        tradesPlaced = trades?.length || 0;
        tradesScore = Math.min((tradesPlaced / MIN_TRADES_FOR_FULL) * WEIGHT_TRADES, WEIGHT_TRADES);

        // 5. Mistakes avoided
        const [ordersRes, allTradesRes, positionsRes] = await Promise.all([
          supabase.from('demo_orders').select('*').eq('demo_account_id', demoAccount.id),
          supabase.from('demo_trades').select('*').eq('demo_account_id', demoAccount.id),
          supabase.from('demo_positions').select('*').eq('demo_account_id', demoAccount.id),
        ]);

        const mistakes = detectMistakes({
          orders: (ordersRes.data || []) as DemoOrder[],
          trades: (allTradesRes.data || []) as DemoTrade[],
          positions: (positionsRes.data || []) as DemoPosition[],
          startingCash: demoAccount.starting_cash,
        });

        // More mistakes = lower score. 0 mistakes = full score, 5+ = zero
        const maxMistakes = 5;
        mistakesAvoided = Math.max(maxMistakes - mistakes.length, 0);
        mistakeScore = Math.max((mistakesAvoided / maxMistakes) * WEIGHT_MISTAKES, 0);
      }

      // 4. EOD replays viewed
      let eodReplaysViewed = 0;
      if (demoAccount) {
        const { data: eodResults } = await supabase
          .from('eod_account_results')
          .select('id')
          .eq('demo_account_id', demoAccount.id);

        eodReplaysViewed = eodResults?.length || 0;
      }
      const eodScore = Math.min((eodReplaysViewed / MIN_EOD_FOR_FULL) * WEIGHT_EOD, WEIGHT_EOD);

      // Total
      const totalScore = Math.round(lessonScore + quizScore + tradesScore + eodScore + mistakeScore);

      return {
        lessonsCompleted,
        totalLessons,
        quizAvgScore: Math.round(quizAvgScore * 100) / 100,
        tradesPlaced,
        eodReplaysViewed,
        mistakesAvoided,
        totalScore: Math.min(totalScore, 100),
        isReady: totalScore >= READY_THRESHOLD,
      };
    },
  });
}
