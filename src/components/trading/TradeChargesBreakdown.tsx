import { cn, formatCurrency } from '@/lib/utils';
import type { ChargesEstimate } from '@/types/demo';

interface TradeChargesBreakdownProps {
  estimate: ChargesEstimate;
}

export function TradeChargesBreakdown({ estimate }: TradeChargesBreakdownProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <table className="w-full text-xs">
        <tbody>
          {/* Gross Amount */}
          <tr className="border-b border-gray-200">
            <td className="px-3 py-2 font-medium text-gray-700">Gross Amount</td>
            <td className="px-3 py-2 text-right font-num tabular-nums text-gray-900">
              {formatCurrency(estimate.grossAmount)}
            </td>
          </tr>

          {/* Fee line items */}
          {estimate.fees.map((fee, i) => (
            <tr key={fee.rule.id || i} className="border-b border-gray-100">
              <td className="px-3 py-1.5 text-gray-500 pl-5">
                {fee.rule.name}
                {fee.rule.rate_type === 'percentage' && (
                  <span className="ml-1 text-gray-400">({fee.rule.rate_value}%)</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-right font-num tabular-nums text-gray-600">
                {formatCurrency(fee.amount)}
              </td>
            </tr>
          ))}

          {/* Total Charges */}
          <tr className="border-b border-gray-200 bg-gray-100/50">
            <td className="px-3 py-2 font-medium text-gray-700">Total Charges</td>
            <td className="px-3 py-2 text-right font-num tabular-nums font-medium text-gray-900">
              {formatCurrency(estimate.totalCharges)}
            </td>
          </tr>

          {/* Net Amount */}
          <tr className="bg-white">
            <td className="px-3 py-2.5 font-semibold text-gray-900">Net Amount</td>
            <td className={cn(
              'px-3 py-2.5 text-right font-num tabular-nums font-bold text-sm',
              'text-gray-900'
            )}>
              {formatCurrency(estimate.netAmount)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
