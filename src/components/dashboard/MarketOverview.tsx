import { useMarketData } from '@/hooks/useMarketData';
import { MarketIndexCards } from './MarketIndexCards';
import { MarketStrength } from './MarketStrength';
import { MarketSentiment } from './MarketSentiment';
import { TopMovers } from './TopMovers';
import { formatDateTime } from '@/lib/utils';
import { Activity } from 'lucide-react';

export function MarketOverview() {
  const { data, isLoading, error } = useMarketData();

  if (error) return null;

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Market Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-[120px] sm:h-[140px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="skeleton rounded-2xl h-[280px]" />
          <div className="skeleton rounded-2xl h-[280px]" />
        </div>
        <div className="skeleton rounded-2xl h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Market Overview</h2>
        {data.lastUpdated && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <Activity size={12} className="text-success animate-pulse" />
            <span>Updated {formatDateTime(data.lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* Index + Stats Cards */}
      <MarketIndexCards indices={data.indices} stats={data.stats} />

      {/* Strength + Sentiment side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <MarketStrength stats={data.stats} />
        <MarketSentiment sentiment={data.sentiment} advancerRatio={data.advancerRatio} />
      </div>

      {/* Top Movers */}
      <TopMovers prices={data.livePrices} />
    </div>
  );
}
