import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketSentiment as SentimentType } from '@/types';

interface Props {
  sentiment: SentimentType;
  advancerRatio: number;
}

const sentimentConfig: Record<SentimentType, {
  color: string;
  bgColor: string;
  isBullish: boolean;
}> = {
  'Bull':      { color: 'text-success',    bgColor: 'bg-success/10', isBullish: true },
  'Mild Bull': { color: 'text-success/80', bgColor: 'bg-success/8',  isBullish: true },
  'Neutral':   { color: 'text-muted',      bgColor: 'bg-white/5',    isBullish: true },
  'Mild Bear': { color: 'text-danger/80',  bgColor: 'bg-danger/8',   isBullish: false },
  'Bear':      { color: 'text-danger',     bgColor: 'bg-danger/10',  isBullish: false },
};

export function MarketSentiment({ sentiment, advancerRatio }: Props) {
  const config = sentimentConfig[sentiment];
  const pct = Math.round(advancerRatio * 100);

  return (
    <Card className="flex flex-col justify-between">
      <h3 className="text-sm font-semibold tracking-wide">Market Sentiment</h3>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 mt-2">
        {/* Icon + Sentiment label */}
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            config.bgColor
          )}>
            {config.isBullish ? (
              <TrendingUp size={28} className={config.color} />
            ) : (
              <TrendingDown size={28} className={config.color} />
            )}
          </div>
          <p className={cn('text-3xl sm:text-4xl font-extrabold tracking-tight', config.color)}>
            {sentiment}
          </p>
        </div>

        {/* Gradient bar with glow */}
        <div className="w-full max-w-[260px]">
          <div className="relative h-3.5 rounded-full overflow-hidden shadow-inner">
            {/* Gradient track */}
            <div className="absolute inset-0 bg-gradient-to-r from-danger via-amber-400 to-success rounded-full" />
            {/* Glow layer under indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full blur-md opacity-60"
              style={{
                left: `calc(${pct}% - 16px)`,
                background: pct > 50 ? '#22c55e' : '#ef4444',
              }}
            />
            {/* Indicator dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-[2.5px] shadow-xl transition-all duration-700 ease-out"
              style={{
                left: `calc(${pct}% - 10px)`,
                borderColor: pct > 50 ? '#22c55e' : '#ef4444',
                boxShadow: `0 0 10px ${pct > 50 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex items-center gap-1">
              <TrendingDown size={10} className="text-danger" />
              <span className="text-[10px] font-semibold text-danger">Bear</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-success">Bull</span>
              <TrendingUp size={10} className="text-success" />
            </div>
          </div>
        </div>

        {/* Advancer ratio as prominent metric */}
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-border bg-surface">
          <span className="text-xs text-muted font-medium">Advancer Ratio</span>
          <div className="w-px h-4 bg-border" />
          <span className={cn(
            'text-xl font-extrabold font-num',
            pct >= 50 ? 'text-success' : 'text-danger'
          )}>
            {pct}%
          </span>
        </div>
      </div>
    </Card>
  );
}
