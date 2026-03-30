import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Wallet,
  Briefcase,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { EodAccountResult } from '@/types/demo';

interface EodReplayPanelProps {
  eodResult: EodAccountResult;
}

const STEPS = [
  { label: 'What happened today', icon: ClipboardList },
  { label: 'Why cash changed', icon: Wallet },
  { label: 'Why holdings changed', icon: Briefcase },
  { label: 'Why P&L changed', icon: TrendingUp },
  { label: "What's next", icon: Lightbulb },
];

export function EodReplayPanel({ eodResult }: EodReplayPanelProps) {
  const [step, setStep] = useState(0);
  const summary = eodResult.summary_json;

  function renderStepContent() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Here is a summary of everything that happened during today's end-of-day processing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <CheckCircle size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 font-num">{summary.ordersProcessed}</p>
                  <p className="text-xs text-gray-500">Orders Processed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <ArrowRight size={20} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 font-num">{summary.tradesBooked}</p>
                  <p className="text-xs text-gray-500">Trades Booked</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <XCircle size={20} className="text-red-600 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 font-num">{summary.ordersCancelled}</p>
                  <p className="text-xs text-gray-500">Orders Cancelled</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              {summary.chargesPosted > 0 && (
                <span>Total charges posted: {formatCurrency(summary.chargesPosted)}</span>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Your cash balance changed because of trades executed and charges applied today.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-600">Opening Cash</span>
                <span className="font-bold font-num text-gray-900">{formatCurrency(summary.openingCash)}</span>
              </div>
              <div className="flex items-center justify-center">
                <ArrowDown size={18} className="text-gray-400" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border"
                style={{
                  backgroundColor: summary.cashChange >= 0 ? '#f0fdf4' : '#fef2f2',
                  borderColor: summary.cashChange >= 0 ? '#bbf7d0' : '#fecaca',
                }}>
                <span className="text-sm text-gray-600">Cash Change</span>
                <span className={cn(
                  'font-bold font-num',
                  summary.cashChange >= 0 ? 'text-green-700' : 'text-red-700'
                )}>
                  {summary.cashChange >= 0 ? '+' : ''}{formatCurrency(summary.cashChange)}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <ArrowDown size={18} className="text-gray-400" />
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Closing Cash</span>
                <span className="font-bold font-num text-lg text-gray-900">{formatCurrency(summary.closingCash)}</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              These are the stocks whose quantities changed in your portfolio today.
            </p>
            {summary.holdingsChange.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No holdings changes today.
              </div>
            ) : (
              <div className="space-y-2">
                {summary.holdingsChange.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{h.symbol}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{h.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm font-num">
                        <span className="text-gray-500">{h.qtyBefore}</span>
                        <ArrowRight size={14} className="text-gray-400" />
                        <span className="font-bold text-gray-900">{h.qtyAfter}</span>
                      </div>
                      <span className={cn(
                        'text-xs font-num',
                        h.qtyAfter > h.qtyBefore ? 'text-green-600' : h.qtyAfter < h.qtyBefore ? 'text-red-600' : 'text-gray-500'
                      )}>
                        {h.qtyAfter > h.qtyBefore ? '+' : ''}{h.qtyAfter - h.qtyBefore} shares
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Your profit and loss changed based on trades settled and market price movements.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Realized P&L</p>
                <p className={cn(
                  'text-2xl font-bold font-num',
                  summary.pnlChange.realized >= 0 ? 'text-green-700' : 'text-red-700'
                )}>
                  {summary.pnlChange.realized >= 0 ? '+' : ''}{formatCurrency(summary.pnlChange.realized)}
                </p>
                <p className="text-xs text-gray-500 mt-1">From closed positions</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Unrealized P&L</p>
                <p className={cn(
                  'text-2xl font-bold font-num',
                  summary.pnlChange.unrealized >= 0 ? 'text-green-700' : 'text-red-700'
                )}>
                  {summary.pnlChange.unrealized >= 0 ? '+' : ''}{formatCurrency(summary.pnlChange.unrealized)}
                </p>
                <p className="text-xs text-gray-500 mt-1">From open positions</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total P&L Change</span>
                <span className={cn(
                  'text-lg font-bold font-num',
                  (summary.pnlChange.realized + summary.pnlChange.unrealized) >= 0 ? 'text-green-700' : 'text-red-700'
                )}>
                  {(summary.pnlChange.realized + summary.pnlChange.unrealized) >= 0 ? '+' : ''}
                  {formatCurrency(summary.pnlChange.realized + summary.pnlChange.unrealized)}
                </span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Based on today's activity, here is what we suggest you explore next.
            </p>
            {summary.nextLesson ? (
              <div className="p-5 bg-gradient-to-r from-[#0b8a00]/5 to-transparent rounded-xl border border-[#0b8a00]/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b8a00]/10 flex items-center justify-center shrink-0">
                    <Lightbulb size={20} className="text-[#0b8a00]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Suggested Lesson</p>
                    <p className="text-sm text-gray-600 mt-1">{summary.nextLesson}</p>
                    <Button size="sm" className="mt-3" icon={<ArrowRight size={14} />}>
                      Go to Lesson
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Great job today!</p>
                <p className="text-xs text-gray-500 mt-1">Keep exploring the platform to improve your readiness score.</p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4">
              <p className="text-xs text-gray-500">
                Portfolio Value: <span className="font-bold font-num text-gray-900">{formatCurrency(eodResult.portfolio_value)}</span>
                {' | '}Total Charges: <span className="font-bold font-num text-gray-900">{formatCurrency(eodResult.total_charges)}</span>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const StepIcon = STEPS[step].icon;

  return (
    <Card className="overflow-hidden">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all duration-300',
              i === step ? 'bg-[#0b8a00] scale-125' : i < step ? 'bg-[#0b8a00]/40' : 'bg-gray-200'
            )}
            title={s.label}
          />
        ))}
      </div>

      {/* Step header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#0b8a00]/10 flex items-center justify-center">
          <StepIcon size={20} className="text-[#0b8a00]" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Step {step + 1} of {STEPS.length}</p>
          <h3 className="font-semibold text-base text-gray-900">{STEPS[step].label}</h3>
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[220px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          icon={<ChevronLeft size={16} />}
        >
          Previous
        </Button>
        <span className="text-xs text-gray-500 font-num">{step + 1} / {STEPS.length}</span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
          icon={<ChevronRight size={16} />}
        >
          Next
        </Button>
      </div>
    </Card>
  );
}
