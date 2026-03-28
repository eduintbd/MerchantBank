import { useState, useMemo } from 'react';
import historicalData from '@/data/dsex-historical.json';
import { Card, StatCard } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type TimeRange = '1Y' | '3Y' | '5Y' | 'All';

const rangeMonths: Record<TimeRange, number> = {
  '1Y': 12,
  '3Y': 36,
  '5Y': 60,
  'All': 999,
};

export function MarketHistoryPage() {
  const [range, setRange] = useState<TimeRange>('All');

  const filteredData = useMemo(() => {
    const months = rangeMonths[range];
    return historicalData.slice(-months);
  }, [range]);

  const stats = useMemo(() => {
    const dsexValues = filteredData.map(d => d.dsex);
    const highest = Math.max(...dsexValues);
    const lowest = Math.min(...dsexValues);
    const current = dsexValues[dsexValues.length - 1];
    const avg = Math.round(dsexValues.reduce((a, b) => a + b, 0) / dsexValues.length);
    return { highest, lowest, current, avg };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 size={24} className="text-info" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Market History</h1>
        </div>
        <p className="text-muted text-sm sm:text-base mt-1">
          Historical performance of DSEX, DSES, and DS30 indices
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit mb-5 sm:mb-6">
        {(['1Y', '3Y', '5Y', 'All'] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              range === r ? 'bg-info text-white shadow-sm' : 'text-muted hover:text-foreground'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Card className="mb-5 sm:mb-6">
        <h2 className="font-semibold text-base mb-4">Index Performance</h2>
        <div className="h-[300px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#888' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#888' }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17,17,17,0.95)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="dsex" stroke="#3b82f6" strokeWidth={2} dot={false} name="DSEX" />
              <Line type="monotone" dataKey="dses" stroke="#22c55e" strokeWidth={2} dot={false} name="DSES" />
              <Line type="monotone" dataKey="ds30" stroke="#a855f7" strokeWidth={2} dot={false} name="DS30" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-xs text-muted">DSEX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
            <span className="text-xs text-muted">DSES</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#a855f7]" />
            <span className="text-xs text-muted">DS30</span>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">DSEX Summary ({range})</h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        <StatCard
          title="Highest"
          value={stats.highest.toLocaleString()}
          icon={<TrendingUp size={20} />}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Lowest"
          value={stats.lowest.toLocaleString()}
          icon={<TrendingDown size={20} />}
          iconColor="bg-danger/10 text-danger"
        />
        <StatCard
          title="Current"
          value={stats.current.toLocaleString()}
          icon={<Activity size={20} />}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Average"
          value={stats.avg.toLocaleString()}
          icon={<BarChart3 size={20} />}
          iconColor="bg-primary/10 text-primary"
        />
      </div>      </div>

    </div>
  );
}