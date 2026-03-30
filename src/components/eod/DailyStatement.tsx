import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import type { DemoStatement } from '@/types/demo';

interface DailyStatementProps {
  statement: DemoStatement;
}

export function DailyStatement({ statement }: DailyStatementProps) {
  const details = statement.details_json || {};
  const trades = (details.trades || []) as Array<{
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    gross_amount: number;
    net_amount: number;
  }>;
  const charges = (details.charges || []) as Array<{
    fee_name: string;
    amount: number;
  }>;

  return (
    <Card padding={false} className="overflow-hidden">
      {/* Statement Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <FileText size={20} />
          <h2 className="font-bold text-base tracking-tight">Daily Statement</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Business Date</p>
            <p className="font-semibold text-sm mt-0.5">{formatDate(statement.business_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Account</p>
            <p className="font-semibold text-sm mt-0.5 font-num">{statement.demo_account_id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Opening Balance */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Opening Cash Balance</span>
          <span className="font-bold font-num text-gray-900">{formatCurrency(statement.opening_cash)}</span>
        </div>

        {/* Trades Section */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Trades</h3>
          {trades.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No trades on this date.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-3 font-medium">Symbol</th>
                    <th className="py-2 pr-3 font-medium">Side</th>
                    <th className="py-2 pr-3 font-medium text-right">Qty</th>
                    <th className="py-2 pr-3 font-medium text-right">Price</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-gray-900">{trade.symbol}</td>
                      <td className="py-2.5 pr-3">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          trade.side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-num">{trade.quantity}</td>
                      <td className="py-2.5 pr-3 text-right font-num">{formatCurrency(trade.price)}</td>
                      <td className="py-2.5 text-right font-num font-medium">{formatCurrency(trade.gross_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Total Buys</span>
            <span className="text-sm font-num font-medium text-red-600">-{formatCurrency(statement.total_buys)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">Total Sells</span>
            <span className="text-sm font-num font-medium text-green-600">+{formatCurrency(statement.total_sells)}</span>
          </div>
        </div>

        {/* Charges Section */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Charges & Fees</h3>
          {charges.length === 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Charges</span>
              <span className="text-sm font-num font-medium text-gray-900">{formatCurrency(statement.total_charges)}</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {charges.map((charge, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{charge.fee_name}</span>
                  <span className="font-num text-gray-900">{formatCurrency(charge.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-700">Total Charges</span>
                <span className="font-num font-bold text-gray-900">{formatCurrency(statement.total_charges)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Closing Balance */}
        <div className="flex items-center justify-between py-3 border-t-2 border-gray-900">
          <span className="text-sm font-bold text-gray-900">Closing Cash Balance</span>
          <span className="text-lg font-bold font-num text-gray-900">{formatCurrency(statement.closing_cash)}</span>
        </div>

        {/* Portfolio Value */}
        <div className="flex items-center justify-between p-4 bg-[#0b8a00]/5 rounded-xl border border-[#0b8a00]/15">
          <span className="text-sm font-medium text-gray-700">Portfolio Value (Cash + Holdings)</span>
          <span className="text-lg font-bold font-num text-[#0b8a00]">{formatCurrency(statement.portfolio_value)}</span>
        </div>
      </div>
    </Card>
  );
}
