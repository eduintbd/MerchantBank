import { Card } from '@/components/ui/Card';
import type { MarketSentiment as SentimentType } from '@/types';

interface Props {
  sentiment: SentimentType;
  advancerRatio: number;
}

const sentimentConfig: Record<SentimentType, { color: string; emoji: string }> = {
  'Bull': { color: 'text-success', emoji: '' },
  'Mild Bull': { color: 'text-success/80', emoji: '' },
  'Neutral': { color: 'text-muted', emoji: '' },
  'Mild Bear': { color: 'text-danger/80', emoji: '' },
  'Bear': { color: 'text-danger', emoji: '' },
};

export function MarketSentiment({ sentiment, advancerRatio }: Props) {
  const config = sentimentConfig[sentiment];
  const pct = Math.round(advancerRatio * 100);

  return (
    <Card className="flex flex-col justify-between">
      <h3 className="text-sm font-semibold mb-4">Market Sentiment</h3>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Sentiment label */}
        <div className="text-center">
          <p className={`text-3xl sm:text-4xl font-bold ${config.color}`}>{sentiment}</p>
        </div>

        {/* Gradient bar */}
        <div className="w-full max-w-[240px]">
          <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-danger via-warning to-success">
            {/* Indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-background shadow-lg transition-all duration-500"
              style={{ left: `calc(${pct}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-danger">Bear</span>
            <span className="text-[10px] text-success">Bull</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted text-center mt-4">
        Advancer Ratio: <span className="font-semibold font-num text-foreground">{pct}%</span>
      </p>
    </Card>
  );
}
