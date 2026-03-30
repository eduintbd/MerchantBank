import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Receipt,
  RotateCcw,
  Sun,
  CreditCard,
  MinusCircle,
  HelpCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { useDemoCashLedger } from '@/hooks/useDemoCashLedger';
import type { DemoCashLedgerEntry, LedgerEntryType } from '@/types/demo';

const entryConfig: Record<LedgerEntryType, {
  icon: typeof ArrowDownCircle;
  color: string;
  bgColor: string;
  label: string;
}> = {
  initial_funding: {
    icon: Banknote,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Initial Funding',
  },
  trade_buy: {
    icon: ArrowUpCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Buy Trade',
  },
  trade_sell: {
    icon: ArrowDownCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Sell Trade',
  },
  charge: {
    icon: Receipt,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Charge',
  },
  eod_adjustment: {
    icon: Sun,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'EOD Adjustment',
  },
  manual_credit: {
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Manual Credit',
  },
  manual_debit: {
    icon: MinusCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Manual Debit',
  },
  reset: {
    icon: RotateCcw,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Account Reset',
  },
};

function getEntryConfig(type: LedgerEntryType) {
  return entryConfig[type] || {
    icon: HelpCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: type.replace(/_/g, ' '),
  };
}

export function ActivityTimeline() {
  const { data: entries, isLoading } = useDemoCashLedger();

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  const ledger = entries || [];

  if (ledger.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No activity yet.</p>
          <p className="text-xs text-gray-400 mt-1">Your cash ledger entries will appear here as you trade.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Activity Timeline</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">{ledger.length} entries</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-7 sm:left-8 top-0 bottom-0 w-px bg-gray-200" />

        <div className="divide-y divide-gray-50">
          {ledger.map((entry: DemoCashLedgerEntry, idx: number) => {
            const config = getEntryConfig(entry.entry_type);
            const Icon = config.icon;
            const debit = Number(entry.debit);
            const credit = Number(entry.credit);
            const isCredit = credit > 0;
            const amount = isCredit ? credit : debit;

            return (
              <div key={entry.id} className="relative flex items-start gap-3 px-4 sm:px-5 py-3">
                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">{config.label}</span>
                    </div>
                    {entry.narration && (
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed truncate max-w-[240px] sm:max-w-none">
                        {entry.narration}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5 font-num">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </div>

                  {/* Amount + balance */}
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'text-xs font-semibold font-num tabular-nums',
                        isCredit ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {isCredit ? '+' : '-'}{formatCurrency(amount)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-num tabular-nums mt-0.5">
                      Bal: {formatCurrency(entry.balance_after)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
