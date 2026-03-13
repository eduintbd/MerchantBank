import { cn } from '@/lib/utils';
import type { MarketStats } from '@/types';

interface Props {
  stats: MarketStats;
}

export function MarketBreadth({ stats }: Props) {
  const total = stats.advancers + stats.decliners + stats.unchanged;
  const advPct = total > 0 ? (stats.advancers / total) * 100 : 0;
  const decPct = total > 0 ? (stats.decliners / total) * 100 : 0;
  const unchPct = total > 0 ? (stats.unchanged / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-card-solid p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold tracking-wide mb-3">Market Breadth</h3>

      {/* Stacked bar */}
      <div className="flex h-8 rounded-lg overflow-hidden mb-3">
        <div
          className="bg-success flex items-center justify-center transition-all duration-500"
          style={{ width: `${advPct}%` }}
        >
          {advPct > 10 && <span className="text-[10px] font-bold text-white">{stats.advancers}</span>}
        </div>
        <div
          className="bg-gray-600 flex items-center justify-center transition-all duration-500"
          style={{ width: `${unchPct}%` }}
        >
          {unchPct > 10 && <span className="text-[10px] font-bold text-white">{stats.unchanged}</span>}
        </div>
        <div
          className="bg-danger flex items-center justify-center transition-all duration-500"
          style={{ width: `${decPct}%` }}
        >
          {decPct > 10 && <span className="text-[10px] font-bold text-white">{stats.decliners}</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-success" />
          <span className="text-muted">Adv</span>
          <span className="font-bold font-num text-success">{stats.advancers}</span>
          <span className="text-muted font-num">({advPct.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-500" />
          <span className="text-muted">Unch</span>
          <span className="font-bold font-num text-muted">{stats.unchanged}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-danger" />
          <span className="text-muted">Dec</span>
          <span className="font-bold font-num text-danger">{stats.decliners}</span>
          <span className="text-muted font-num">({decPct.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}
