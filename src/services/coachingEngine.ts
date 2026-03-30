import type { CoachingTrigger, CoachingSeverity, DemoOrder, DemoPosition } from '@/types/demo';

export interface CoachingRule {
  trigger: CoachingTrigger;
  title: string;
  message: string;
  severity: CoachingSeverity;
  lessonHint?: string;
  check: (context: CoachingContext) => boolean;
}

export interface CoachingContext {
  totalOrders: number;
  totalFills: number;
  recentOrders: DemoOrder[];
  positions: DemoPosition[];
  availableCash: number;
  startingCash: number;
  realizedPnl: number;
  unrealizedPnl: number;
  cancelledCount: number;
  lastAction?: string;
}

/**
 * All coaching rules. Each rule defines a trigger condition and advice.
 */
export const COACHING_RULES: CoachingRule[] = [
  {
    trigger: 'first_order',
    title: 'Your First Order!',
    message: 'Congratulations on placing your first order! Watch the order status to learn how orders move through the lifecycle: Submitted → Queued → Filled.',
    severity: 'success',
    lessonHint: 'Understanding Order Lifecycle',
    check: (ctx) => ctx.totalOrders === 1 && ctx.lastAction === 'order_placed',
  },
  {
    trigger: 'first_fill',
    title: 'First Trade Executed!',
    message: 'Your first trade has been filled! Check your Portfolio to see your new holding, and look at the Cash Ledger to understand how your balance changed.',
    severity: 'success',
    lessonHint: 'Reading Your Portfolio',
    check: (ctx) => ctx.totalFills === 1 && ctx.lastAction === 'order_filled',
  },
  {
    trigger: 'order_rejected',
    title: 'Order Rejected',
    message: 'Your order was rejected. This usually happens due to insufficient buying power or trying to sell more shares than you own. Review the rejection reason and try again.',
    severity: 'warning',
    lessonHint: 'Why Orders Get Rejected',
    check: (ctx) => ctx.lastAction === 'order_rejected',
  },
  {
    trigger: 'loss_threshold',
    title: 'Unrealized Loss Alert',
    message: 'Your portfolio has an unrealized loss exceeding 5% of your starting capital. Consider reviewing your positions and learning about stop-loss strategies.',
    severity: 'warning',
    lessonHint: 'Managing Risk with Stop Losses',
    check: (ctx) => ctx.unrealizedPnl < -(ctx.startingCash * 0.05),
  },
  {
    trigger: 'concentration_risk',
    title: 'Portfolio Concentration Warning',
    message: 'More than 40% of your portfolio is in a single stock. Diversification helps manage risk — consider spreading your investments across different sectors.',
    severity: 'warning',
    lessonHint: 'Portfolio Diversification',
    check: (ctx) => {
      if (ctx.positions.length < 2) return false;
      const totalValue = ctx.positions.reduce((s, p) => s + Number(p.market_value), 0);
      if (totalValue <= 0) return false;
      return ctx.positions.some(p => (Number(p.market_value) / totalValue) > 0.4);
    },
  },
  {
    trigger: 'overtrading',
    title: 'Overtrading Detected',
    message: 'You\'ve placed more than 10 orders today. Frequent trading increases your charges and can lead to impulsive decisions. Take a step back and review your strategy.',
    severity: 'warning',
    lessonHint: 'Trading Discipline',
    check: (ctx) => {
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ctx.recentOrders.filter(o => o.created_at.startsWith(today));
      return todayOrders.length > 10;
    },
  },
  {
    trigger: 'repeated_cancellation',
    title: 'Frequent Cancellations',
    message: 'You\'ve cancelled several orders recently. This might indicate uncertainty. Consider using limit orders with well-researched price targets instead.',
    severity: 'info',
    lessonHint: 'Effective Use of Limit Orders',
    check: (ctx) => ctx.cancelledCount > 5,
  },
  {
    trigger: 'milestone_reached',
    title: 'Positive Returns!',
    message: 'Your portfolio is showing positive returns! Great job applying what you\'ve learned. Keep tracking your performance and understanding what worked.',
    severity: 'success',
    lessonHint: 'Analyzing Your Performance',
    check: (ctx) => ctx.realizedPnl > 0 && ctx.totalFills >= 3 && ctx.lastAction === 'order_filled',
  },
];

/**
 * Evaluate coaching rules against current context and return triggered events.
 */
export function evaluateCoaching(context: CoachingContext): CoachingRule[] {
  return COACHING_RULES.filter(rule => rule.check(context));
}
