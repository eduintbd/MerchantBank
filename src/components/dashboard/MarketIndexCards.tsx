import { Card } from '@/components/ui/Card';
import { formatNumber, formatVolume, formatValueBn, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { MarketIndex, MarketStats } from '@/types';

interface Props {
  indices: MarketIndex[];
  stats: MarketStats;
}

const indexConfig: Record<string, { accent: string; accentBg: string; label: string }> = {
  DSEX: { accent: 'border-l-blue-500', accentBg: 'bg-blue-500/10 text-blue-500', label: 'DSEX' },
  DSES: { accent: 'border-l-emerald-500', accentBg: 'bg-emerald-500/10 text-emerald-500', label: 'DSES' },
  DS30: { accent: 'border-l-purple-500', accentBg: 'bg-purple-500/10 text-purple-500', label: 'DS30' },
};

function IndexCard({ index }: { index: MarketIndex | undefined; name: string }) {
  if (!index) return null;
  const config = indexConfig[index.index_name] || indexConfig.DSEX;
  const isPositive = index.change >= 0;

  return (
    <Card
      className={cn(
        'border-l-4 !rounded-xl !p-0 overflow-hidden',
        config.accent
      )}
      padding={false}
    >
      <div className="px-4 py-3.5 sm:px-5 sm:py-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md', config.accentBg)}>
              {config.label}
            </span>
          </div>
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-semibold font-num',
            isPositive ? 'text-success' : 'text-danger'
          )}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{index.change_pct.toFixed(2)}%
          </div>
        </div>

        {/* Value */}
        <p className="text-2xl sm:text-[28px] font-bold font-num leading-none tracking-tight text-foreground">
          {index.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {/* Change amount + sparkline placeholder */}
        <div className="flex items-center justify-between mt-2">
          <span className={cn(
            'text-xs font-medium font-num',
            isPositive ? 'text-success' : 'text-danger'
          )}>
            {isPositive ? '+' : ''}{index.change.toFixed(2)} pts
          </span>
          {/* Sparkline area placeholder */}
          <div className="flex items-end gap-px h-4 opacity-40">
            {[40, 55, 45, 60, 50, 70, 65, 75, 60, 80, 70, 85].map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-[3px] rounded-sm',
                  isPositive ? 'bg-success' : 'bg-danger'
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MarketIndexCards({ indices, stats }: Props) {
  const dsex = indices.find(i => i.index_name === 'DSEX');
  const dses = indices.find(i => i.index_name === 'DSES');
  const ds30 = indices.find(i => i.index_name === 'DS30');

  return (
    <div className="space-y-3">
      {/* Row 1: Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <IndexCard index={dsex} name="DSEX" />
        <IndexCard index={dses} name="DSES" />
        <IndexCard index={ds30} name="DS30" />
      </div>

      {/* Row 2: Compact stat pills */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-sm">
          <BarChart3 size={14} className="text-blue-400 shrink-0" />
          <span className="text-[11px] text-muted font-medium">Volume</span>
          <span className="text-sm font-bold font-num text-foreground">{formatVolume(stats.totalVolume)}</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-sm">
          <BarChart3 size={14} className="text-amber-400 shrink-0" />
          <span className="text-[11px] text-muted font-medium">Value</span>
          <span className="text-sm font-bold font-num text-foreground">{formatValueBn(stats.totalValue)}</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-sm">
          <ArrowUpCircle size={14} className="text-success shrink-0" />
          <span className="text-[11px] text-success font-medium">Adv</span>
          <span className="text-sm font-bold font-num text-success">{stats.advancers}</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-sm">
          <ArrowDownCircle size={14} className="text-danger shrink-0" />
          <span className="text-[11px] text-danger font-medium">Dec</span>
          <span className="text-sm font-bold font-num text-danger">{stats.decliners}</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-[11px] text-muted font-medium">Trades</span>
          <span className="text-sm font-bold font-num text-foreground">{formatNumber(stats.totalTrades)}</span>
        </div>
      </div>
    </div>
  );
}
