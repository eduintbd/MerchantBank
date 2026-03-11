import { StatCard } from '@/components/ui/Card';
import { formatNumber, formatVolume, formatValueBn } from '@/lib/utils';
import { TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
    <div className="space-y-3 sm:space-y-4">
      {/* Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
      </div>

      {/* Compact stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Volume', value: formatVolume(stats.totalVolume) },
          { label: 'Value', value: formatValueBn(stats.totalValue) },
          { label: 'Trades', value: formatNumber(stats.totalTrades) },
          { label: 'Advancers', value: String(stats.advancers), icon: ArrowUpCircle, color: 'text-success' },
          { label: 'Decliners', value: String(stats.decliners), icon: ArrowDownCircle, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card/60 px-3 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase tracking-wider">{s.label}</span>
            <span className={`text-sm font-bold font-num ${s.color || 'text-foreground'}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
