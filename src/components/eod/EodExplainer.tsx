import { formatCurrency, cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface EodExplainerProps {
  field: 'cash_change' | 'holdings_change' | 'pnl_change' | 'charges';
  value: number;
}

const EXPLANATIONS: Record<string, (value: number) => string> = {
  cash_change: (value: number) =>
    value >= 0
      ? `Your cash increased by ${formatCurrency(value)} because you received more from sells than you spent on buys and charges today.`
      : `Your cash decreased by ${formatCurrency(Math.abs(value))} because your total purchases and charges exceeded your sell proceeds today.`,
  holdings_change: (value: number) =>
    value >= 0
      ? `Your holdings value went up by ${formatCurrency(value)} due to new purchases or price appreciation in your existing positions.`
      : `Your holdings value dropped by ${formatCurrency(Math.abs(value))} due to sells or market price declines in your positions.`,
  pnl_change: (value: number) =>
    value >= 0
      ? `Your profit increased by ${formatCurrency(value)} from favorable trades and market price movements today.`
      : `Your loss widened by ${formatCurrency(Math.abs(value))} from unfavorable trades or market price drops today.`,
  charges: (value: number) =>
    `You paid ${formatCurrency(value)} in brokerage commissions, CDBL fees, and regulatory charges on today's trades. These charges are deducted from your cash balance.`,
};

export function EodExplainer({ field, value }: EodExplainerProps) {
  const explanation = EXPLANATIONS[field]?.(value) || 'No explanation available for this field.';

  return (
    <div className={cn(
      'flex items-start gap-2.5 p-3 rounded-lg border text-xs',
      'bg-blue-50/50 border-blue-100 text-blue-800'
    )}>
      <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
      <p className="leading-relaxed">{explanation}</p>
    </div>
  );
}
