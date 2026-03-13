import { useSectorPerformance } from '@/hooks/useSectorPerformance';
import { cn, formatVolume } from '@/lib/utils';

function getHeatColor(change: number): string {
  if (change >= 3) return 'bg-emerald-500/90 text-white';
  if (change >= 1.5) return 'bg-emerald-600/70 text-white';
  if (change >= 0.5) return 'bg-emerald-700/50 text-emerald-100';
  if (change >= 0) return 'bg-emerald-900/30 text-emerald-200';
  if (change >= -0.5) return 'bg-red-900/30 text-red-200';
  if (change >= -1.5) return 'bg-red-700/50 text-red-100';
  if (change >= -3) return 'bg-red-600/70 text-white';
  return 'bg-red-500/90 text-white';
}

export function SectorHeatmap() {
  const { data: sectors, isLoading } = useSectorPerformance();

  if (isLoading || !sectors || sectors.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card-solid p-4 sm:p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold tracking-wide mb-3">Sector Heatmap</h3>
        <div className="skeleton h-[200px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card-solid p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide">Sector Heatmap</h3>
        <div className="flex items-center gap-2 text-[9px] text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" />Bearish</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Bullish</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {sectors.map(s => (
          <div
            key={s.sector}
            className={cn(
              'rounded-lg p-2.5 sm:p-3 transition-all hover:scale-[1.02] cursor-default',
              getHeatColor(s.avgChange)
            )}
          >
            <p className="text-[10px] font-semibold truncate leading-tight opacity-90">{s.sector}</p>
            <p className="text-sm sm:text-base font-bold font-num mt-0.5">
              {s.avgChange >= 0 ? '+' : ''}{s.avgChange.toFixed(2)}%
            </p>
            <div className="flex items-center gap-2 mt-1 text-[9px] opacity-75">
              <span>{s.stockCount} stocks</span>
              <span>Vol: {formatVolume(s.totalVolume)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
