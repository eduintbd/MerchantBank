import { Card } from '@/components/ui/Card';
import { formatCurrency, cn } from '@/lib/utils';
import { Loader2, BarChart3 } from 'lucide-react';
import { usePnlReport } from '@/hooks/useDemoReports';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import type { PnlReport as PnlReportType } from '@/types/demo';

export function PnlReport() {
  const { data: report, isLoading } = usePnlReport();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading P&L report...</span>
      </div>
    );
  }

  if (!report || report.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <BarChart3 size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No P&L data available yet. Place some trades first.</p>
        </div>
      </Card>
    );
  }

  const totalRealized = report.reduce((s, r) => s + r.realized_pnl, 0);
  const totalUnrealized = report.reduce((s, r) => s + r.unrealized_pnl, 0);
  const totalCharges = report.reduce((s, r) => s + r.total_charges, 0);
  const totalNet = report.reduce((s, r) => s + r.net_pnl, 0);

  const chartData = report.map((r) => ({
    symbol: r.symbol,
    realized: r.realized_pnl,
    unrealized: r.unrealized_pnl,
  }));

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Realized P&L</p>
          <p className={cn('text-lg font-bold font-num mt-1', totalRealized >= 0 ? 'text-green-700' : 'text-red-700')}>
            {totalRealized >= 0 ? '+' : ''}{formatCurrency(totalRealized)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Unrealized P&L</p>
          <p className={cn('text-lg font-bold font-num mt-1', totalUnrealized >= 0 ? 'text-green-700' : 'text-red-700')}>
            {totalUnrealized >= 0 ? '+' : ''}{formatCurrency(totalUnrealized)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Charges</p>
          <p className="text-lg font-bold font-num text-red-600 mt-1">{formatCurrency(totalCharges)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Net P&L</p>
          <p className={cn('text-lg font-bold font-num mt-1', totalNet >= 0 ? 'text-green-700' : 'text-red-700')}>
            {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
          </p>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <h3 className="font-semibold text-base mb-5">Realized vs Unrealized P&L by Symbol</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="symbol" fontSize={12} tick={{ fill: '#6b7280' }} />
            <YAxis fontSize={12} tick={{ fill: '#6b7280' }} tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}`} />
            <Tooltip
              formatter={(value: any) => formatCurrency(Number(value))}
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                color: '#1a1a2e',
                fontSize: 13,
                padding: '10px 14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <Legend />
            <Bar dataKey="realized" name="Realized" radius={[4, 4, 0, 0]} fill="#0b8a00" />
            <Bar dataKey="unrealized" name="Unrealized" radius={[4, 4, 0, 0]} fill="#4fa3e0" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card padding={false} className="overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-sm text-gray-900">P&L Breakdown by Symbol</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200 bg-gray-50/80">
                <th className="px-5 py-3.5 font-medium">Symbol</th>
                <th className="px-3 py-3.5 font-medium text-right">Realized P&L</th>
                <th className="px-3 py-3.5 font-medium text-right">Unrealized P&L</th>
                <th className="px-3 py-3.5 font-medium text-right">Total P&L</th>
                <th className="px-3 py-3.5 font-medium text-right">Charges</th>
                <th className="px-5 py-3.5 font-medium text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {report.map((row, idx) => (
                <tr key={row.symbol} className={cn('border-b border-gray-100 last:border-0', idx % 2 === 1 && 'bg-gray-50/50')}>
                  <td className="px-5 py-3 font-semibold text-gray-900">{row.symbol}</td>
                  <td className={cn('px-3 py-3 text-right font-num', row.realized_pnl >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {row.realized_pnl >= 0 ? '+' : ''}{formatCurrency(row.realized_pnl)}
                  </td>
                  <td className={cn('px-3 py-3 text-right font-num', row.unrealized_pnl >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {row.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(row.unrealized_pnl)}
                  </td>
                  <td className={cn('px-3 py-3 text-right font-num font-medium', row.total_pnl >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {row.total_pnl >= 0 ? '+' : ''}{formatCurrency(row.total_pnl)}
                  </td>
                  <td className="px-3 py-3 text-right font-num text-red-600">{formatCurrency(row.total_charges)}</td>
                  <td className={cn('px-5 py-3 text-right font-num font-bold', row.net_pnl >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {row.net_pnl >= 0 ? '+' : ''}{formatCurrency(row.net_pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="px-5 py-3 text-gray-900">Total</td>
                <td className={cn('px-3 py-3 text-right font-num', totalRealized >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {totalRealized >= 0 ? '+' : ''}{formatCurrency(totalRealized)}
                </td>
                <td className={cn('px-3 py-3 text-right font-num', totalUnrealized >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {totalUnrealized >= 0 ? '+' : ''}{formatCurrency(totalUnrealized)}
                </td>
                <td className={cn('px-3 py-3 text-right font-num', (totalRealized + totalUnrealized) >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {(totalRealized + totalUnrealized) >= 0 ? '+' : ''}{formatCurrency(totalRealized + totalUnrealized)}
                </td>
                <td className="px-3 py-3 text-right font-num text-red-600">{formatCurrency(totalCharges)}</td>
                <td className={cn('px-5 py-3 text-right font-num', totalNet >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
