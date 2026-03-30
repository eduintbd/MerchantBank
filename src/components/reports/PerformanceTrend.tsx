import { Card } from '@/components/ui/Card';
import { formatCurrency, cn } from '@/lib/utils';
import { Loader2, TrendingUp } from 'lucide-react';
import { usePerformanceTrend } from '@/hooks/useDemoReports';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function PerformanceTrend() {
  const { data: points, isLoading } = usePerformanceTrend();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading performance data...</span>
      </div>
    );
  }

  if (!points || points.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <TrendingUp size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No performance data available yet. Complete an EOD process to see your trend.</p>
        </div>
      </Card>
    );
  }

  const latestValue = points[points.length - 1]?.total_value ?? 0;
  const firstValue = points[0]?.total_value ?? 0;
  const totalChange = latestValue - firstValue;
  const totalChangePct = firstValue > 0 ? ((latestValue - firstValue) / firstValue) * 100 : 0;

  const chartData = points.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
    value: p.total_value,
    portfolio: p.portfolio_value,
    cash: p.cash,
  }));

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Current Value</p>
          <p className="text-xl font-bold font-num text-gray-900 mt-1">{formatCurrency(latestValue)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Starting Value</p>
          <p className="text-xl font-bold font-num text-gray-900 mt-1">{formatCurrency(firstValue)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Return</p>
          <p className={cn('text-xl font-bold font-num mt-1', totalChange >= 0 ? 'text-green-700' : 'text-red-700')}>
            {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
          </p>
          <p className={cn('text-xs font-num mt-0.5', totalChangePct >= 0 ? 'text-green-600' : 'text-red-600')}>
            {totalChangePct >= 0 ? '+' : ''}{totalChangePct.toFixed(2)}%
          </p>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <h3 className="font-semibold text-base mb-5">Portfolio Value Over Time</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0b8a00" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0b8a00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: '#6b7280' }} />
            <YAxis fontSize={12} tick={{ fill: '#6b7280' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(value: any, name: string) => [
                formatCurrency(Number(value)),
                name === 'value' ? 'Total Value' : name === 'portfolio' ? 'Holdings' : 'Cash',
              ]}
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0b8a00"
              strokeWidth={2.5}
              fill="url(#perfGradient)"
              dot={false}
              activeDot={{ r: 5, stroke: '#0b8a00', strokeWidth: 2, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
