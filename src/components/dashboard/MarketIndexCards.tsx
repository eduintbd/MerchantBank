import { StatCard } from '@/components/ui/Card';
import { formatNumber, formatVolume, formatValueBn } from '@/lib/utils';
import { TrendingUp, BarChart3, Activity, ArrowUpCircle, ArrowDownCircle, Repeat } from 'lucide-react';
import type { MarketIndex, MarketStats } from '@/types';

interface Props {
  indices: MarketIndex[];
  stats: MarketStats;
}

export function MarketIndexCards({ indices, stats }: Props) {
  const dsex = indices.find(i => i.index_name === 'DSEX');
  const dses = indices.find(i => i.index_name === 'DSES');
  const ds30 = indices.find(i => i.index_name === 'DS30');

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {/* Row 1: Indices + Total Trade */}
      <StatCard
        title="DSEX Index"
        value={dsex ? dsex.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
        icon={<TrendingUp size={20} />}
        iconColor="bg-info/15 text-info"
        gradient="grad-info"
        trend={dsex ? { value: dsex.change_pct } : undefined}
      />
      <StatCard
        title="DSES Index"
        value={dses ? dses.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
        icon={<TrendingUp size={20} />}
        iconColor="bg-success/15 text-success"
        gradient="grad-success"
        trend={dses ? { value: dses.change_pct } : undefined}
      />
      <StatCard
        title="DS30 Index"
        value={ds30 ? ds30.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
        icon={<TrendingUp size={20} />}
        iconColor="bg-purple/15 text-purple"
        gradient="grad-purple"
        trend={ds30 ? { value: ds30.change_pct } : undefined}
      />
      <StatCard
        title="Total Trades"
        value={formatNumber(stats.totalTrades)}
        icon={<Repeat size={20} />}
        iconColor="bg-warning/15 text-warning"
        gradient="grad-warning"
        subtitle={`${stats.totalStocks} stocks`}
      />

      {/* Row 2: Volume, Value, Advancers, Decliners */}
      <StatCard
        title="Total Volume"
        value={formatVolume(stats.totalVolume)}
        icon={<BarChart3 size={20} />}
        iconColor="bg-info/15 text-info"
        gradient="grad-info"
      />
      <StatCard
        title="Total Value"
        value={formatValueBn(stats.totalValue)}
        icon={<Activity size={20} />}
        iconColor="bg-success/15 text-success"
        gradient="grad-success"
      />
      <StatCard
        title="Advancers"
        value={stats.advancers}
        icon={<ArrowUpCircle size={20} />}
        iconColor="bg-success/15 text-success"
        gradient="grad-success"
      />
      <StatCard
        title="Decliners"
        value={stats.decliners}
        icon={<ArrowDownCircle size={20} />}
        iconColor="bg-danger/15 text-danger"
        gradient="grad-danger"
      />
    </div>
  );
}
