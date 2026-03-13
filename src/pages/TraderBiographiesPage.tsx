import { traderBios } from '@/data/trader-bios';
import { Card } from '@/components/ui/Card';
import { Quote, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const countryColors: Record<string, string> = {
  'United States': 'bg-info/10 text-info border border-info/20',
  'Bangladesh': 'bg-success/10 text-success border border-success/20',
};

export function TraderBiographiesPage() {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-2 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Legendary Investors</h1>
        <p className="text-muted text-sm sm:text-base mt-1">
          Learn from the greatest minds in investing history
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {traderBios.map((trader) => (
          <Card key={trader.name} hover>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                {trader.imageInitial}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base">{trader.name}</h3>
                <p className="text-xs text-muted truncate">{trader.title}</p>
              </div>
            </div>

            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium mb-3',
              countryColors[trader.country] || 'bg-white/5 text-muted border border-border'
            )}>
              <Globe size={10} />
              {trader.country}
            </span>

            <p className="text-sm text-muted leading-relaxed mb-4">{trader.bio}</p>

            <div className="p-3 bg-surface rounded-xl">
              <div className="flex items-start gap-2">
                <Quote size={14} className="shrink-0 text-info mt-0.5" />
                <p className="text-xs sm:text-sm text-foreground/80 italic leading-relaxed">
                  "{trader.quote}"
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>      </div>

    </div>
  );
}