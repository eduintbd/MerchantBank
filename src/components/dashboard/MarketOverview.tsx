import { useMarketData } from '@/hooks/useMarketData';
import { MarketIndexCards } from './MarketIndexCards';
import { MarketStrength } from './MarketStrength';
import { MarketSentiment } from './MarketSentiment';
import { TopMovers } from './TopMovers';
import { formatDateTime, formatCurrency, cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

function TickerStrip({ prices }: { prices: { symbol: string; ltp: number; change_pct: number }[] }) {
  // Show top 20 by volume for the ticker
  const tickerItems = prices.slice(0, 20);
  if (tickerItems.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm mb-4">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {/* Duplicate items for seamless loop */}
        {[...tickerItems, ...tickerItems].map((p, i) => (
          <span key={`${p.symbol}-${i}`} className="inline-flex items-center gap-1.5 mx-4 text-xs">
            <span className="font-semibold text-foreground">{p.symbol}</span>
            <span className="font-num tabular-nums text-foreground/70">{formatCurrency(p.ltp)}</span>
            <span className={cn(
              'font-num tabular-nums font-semibold',
              p.change_pct > 0 ? 'text-success' : p.change_pct < 0 ? 'text-danger' : 'text-muted'
            )}>
              {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none" />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export function MarketOverview() {
  const { data, isLoading, error } = useMarketData();

  if (error) return null;

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Market Overview</h2>
        </div>
        {/* Skeleton for ticker */}
        <div className="skeleton rounded-xl h-[36px]" />
        {/* Skeleton for index cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-[100px]" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-[36px] w-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="skeleton rounded-2xl h-[320px]" />
          <div className="skeleton rounded-2xl h-[320px]" />
        </div>
        <div className="skeleton rounded-2xl h-[400px]" />
      </div>
    );
  }

  // Determine market status from data timestamp
  const now = new Date();
  const lastUpdate = data.lastUpdated ? new Date(data.lastUpdated) : null;
  const timeDiffMin = lastUpdate ? (now.getTime() - lastUpdate.getTime()) / 60000 : Infinity;
  // Consider market "open" if data was updated within the last 10 minutes
  const isMarketOpen = timeDiffMin < 10;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Section header with market status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Market Overview</h2>
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border',
            isMarketOpen
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isMarketOpen ? 'bg-success animate-pulse' : 'bg-danger'
            )} />
            {isMarketOpen ? 'Open' : 'Closed'}
          </div>
        </div>
        {data.lastUpdated && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <Activity size={12} className={isMarketOpen ? 'text-success animate-pulse' : 'text-muted'} />
            <span>Updated {formatDateTime(data.lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* Live ticker strip */}
      <TickerStrip prices={data.livePrices} />

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
