import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Briefcase,
  PlayCircle,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  X,
  ArrowRight,
} from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DemoAccountSummary } from '@/components/dashboard/DemoAccountSummary';
import { useDemoOrders } from '@/hooks/useDemoOrders';
import { useDemoEodRuns } from '@/hooks/useDemoEod';
import { useCoachingEvents, useDismissCoaching } from '@/hooks/useCoaching';
import { useLearningProgress } from '@/hooks/useLearning';
import { useReadinessScore } from '@/hooks/useReadinessScore';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';

const quickActions = [
  {
    label: 'Place Order',
    description: 'Buy or sell stocks',
    icon: ShoppingCart,
    to: '/demo/trading',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'View Portfolio',
    description: 'Your holdings & P&L',
    icon: Briefcase,
    to: '/demo/portfolio',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Run EOD',
    description: 'End-of-day settlement',
    icon: PlayCircle,
    to: '/demo/eod',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    label: 'Learn',
    description: 'Courses & lessons',
    icon: GraduationCap,
    to: '/learning',
    color: 'bg-amber-100 text-amber-600',
  },
];

export function DemoDashboard() {
  const { demoAccount } = useDemo();
  const { data: orders } = useDemoOrders();
  const { data: eodRuns } = useDemoEodRuns();
  const { data: coachingEvents } = useCoachingEvents();
  const dismissCoaching = useDismissCoaching();
  const { data: learningProgress } = useLearningProgress();
  const { data: readiness } = useReadinessScore();

  const recentOrders = (orders || []).slice(0, 5);
  const lastEod = (eodRuns || [])[0] ?? null;
  const undismissedHints = (coachingEvents || []).filter((e) => !e.is_dismissed);

  if (!demoAccount) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 text-sm">No demo account found. Please set up your profile first.</p>
          <Link to="/onboarding">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <DemoAccountSummary />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to}>
            <Card hover className="flex items-center gap-3 !p-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', action.color)}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{action.label}</p>
                <p className="text-[11px] text-gray-500 truncate">{action.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Open Orders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
            <Link to="/demo/trading" className="text-xs text-primary font-medium hover:underline">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No orders yet. Place your first order to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      status={order.side === 'BUY' ? 'active' : 'rejected'}
                      label={order.side}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{order.symbol}</p>
                      <p className="text-[11px] text-gray-500">
                        {order.quantity} shares @ {order.order_type === 'MARKET' ? 'Market' : formatCurrency(order.limit_price || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge status={order.status} size="sm" />
                    {order.status === 'filled' && order.avg_fill_price > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5 font-num">
                        Filled @ {formatCurrency(order.avg_fill_price)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Learning Progress & Readiness */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Learning Progress</h3>
            <Link to="/learning" className="text-xs text-primary font-medium hover:underline">
              Continue learning
            </Link>
          </div>

          {learningProgress ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Lessons completed</span>
                    <span className="font-semibold text-gray-900 font-num">
                      {learningProgress.completedLessons} / {learningProgress.totalLessons}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(learningProgress.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {readiness && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Readiness Score</span>
                    <span
                      className={cn(
                        'text-sm font-bold font-num',
                        readiness.isReady ? 'text-emerald-600' : 'text-amber-600'
                      )}
                    >
                      {readiness.totalScore}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        readiness.isReady ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${Math.min(readiness.totalScore, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    {readiness.isReady
                      ? 'You are ready for real trading!'
                      : 'Keep learning and practicing to increase your readiness.'}
                  </p>
                </div>
              )}

              {learningProgress.progressPercent < 100 && (
                <Link
                  to="/learning"
                  className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Continue to next lesson
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Start your learning journey to build trading skills.</p>
            </div>
          )}
        </Card>

        {/* Last EOD Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Last EOD Settlement</h3>
            <Link to="/demo/eod" className="text-xs text-primary font-medium hover:underline">
              Run EOD
            </Link>
          </div>

          {lastEod ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Business Date</span>
                <span className="text-xs font-semibold text-gray-900">{lastEod.business_date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <Badge status={lastEod.status} size="sm" />
              </div>
              {lastEod.completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Completed</span>
                  <span className="text-[11px] text-gray-700 font-num">
                    {formatDateTime(lastEod.completed_at)}
                  </span>
                </div>
              )}
              {lastEod.status === 'completed' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <p className="text-[11px] text-emerald-700">
                    All orders settled, positions updated, charges posted.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <PlayCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No EOD runs yet. Run your first settlement after placing trades.</p>
            </div>
          )}
        </Card>

        {/* Coaching Hints */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Coaching Hints</h3>
            {undismissedHints.length > 0 && (
              <span className="text-[10px] font-medium text-gray-500">
                {undismissedHints.length} new
              </span>
            )}
          </div>

          {undismissedHints.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">
                No new coaching hints. Keep trading and you'll receive personalized advice.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {undismissedHints.slice(0, 3).map((event) => {
                const severityStyles: Record<string, string> = {
                  info: 'bg-blue-50 border-blue-100',
                  warning: 'bg-amber-50 border-amber-100',
                  success: 'bg-emerald-50 border-emerald-100',
                };
                const iconStyles: Record<string, string> = {
                  info: 'text-blue-600',
                  warning: 'text-amber-600',
                  success: 'text-emerald-600',
                };

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      severityStyles[event.severity] || 'bg-gray-50 border-gray-100'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {event.severity === 'warning' ? (
                        <AlertCircle className={cn('w-4 h-4 mt-0.5 shrink-0', iconStyles[event.severity])} />
                      ) : (
                        <Lightbulb className={cn('w-4 h-4 mt-0.5 shrink-0', iconStyles[event.severity])} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{event.title}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{event.message}</p>
                        {event.lesson_title && (
                          <Link
                            to="/learning"
                            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-primary hover:underline"
                          >
                            <GraduationCap className="w-3 h-3" />
                            {event.lesson_title}
                          </Link>
                        )}
                      </div>
                      <button
                        onClick={() => dismissCoaching.mutate(event.id)}
                        className="p-1 rounded hover:bg-black/5 transition-colors shrink-0"
                        aria-label="Dismiss hint"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
