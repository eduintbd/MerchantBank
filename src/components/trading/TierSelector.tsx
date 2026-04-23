import { Link } from 'react-router-dom';
import { Check, Sparkles, TrendingUp, Gem, Eye, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscriptionTier, type SubscriptionTier } from '@/hooks/useSubscriptionTier';

interface TierSpec {
  id: SubscriptionTier;
  name: string;
  price: string;
  tagline: string;
  icon: typeof Sparkles;
  accent: string;
  features: string[];
}

const TIERS: TierSpec[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    tagline: 'Clean, tap-to-trade',
    icon: Sparkles,
    accent: 'text-[#00b386]',
    features: ['Market orders', 'Live DSE/CSE prices', 'Tap-to-buy amounts', 'Basic watchlist'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '৳499/mo',
    tagline: 'Signals & dense data',
    icon: TrendingUp,
    accent: 'text-[#0a84ff]',
    features: ['BUY/SELL signals', 'Limit & stop orders', 'EOD reports', 'Advanced filters'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '৳1,999/mo',
    tagline: 'Pro charts & alerts',
    icon: Gem,
    accent: 'text-[#a855f7]',
    features: ['TradingView charts', 'Drawing tools & alerts', 'Strategy backtesting', 'Broker API access'],
  },
];

export function TierSelector() {
  const { activeTier, currentView, previewTier, previewRemaining, startPreview, stopPreview, canUse, isAdmin } = useSubscriptionTier();

  return (
    <div className="mb-5 sm:mb-6">
      {previewTier && (
        <div className="mb-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#a855f7]/8 border border-[#a855f7]/30">
          <div className="flex items-center gap-2 min-w-0">
            <Eye size={14} className="text-[#a855f7] shrink-0" />
            <p className="text-xs text-foreground truncate">
              <span className="font-semibold">Previewing {previewTier}</span>
              {' — '}<span className="text-muted">upgrade to keep using</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted font-num">{Math.max(0, Math.ceil(previewRemaining / 1000))}s</span>
            <Link to="/billing" className="text-xs font-semibold text-[#a855f7] hover:underline">Upgrade</Link>
            <button onClick={stopPreview} className="text-xs text-muted hover:text-foreground">Exit</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TIERS.map(tier => {
          const unlocked = canUse(tier.id);
          const isCurrent = currentView === tier.id;
          const Icon = tier.icon;
          return (
            <div
              key={tier.id}
              className={cn(
                'relative rounded-2xl border p-4 transition-all',
                isCurrent ? 'border-foreground/20 bg-card-solid shadow-[0_2px_12px_rgba(0,0,0,0.06)]' : 'border-border bg-surface hover:border-foreground/10',
              )}
            >
              {isCurrent && (
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground bg-foreground/10 px-2 py-0.5 rounded-full">
                  {previewTier ? <><Eye size={10} /> Previewing</> : <><Check size={10} /> Active</>}
                </span>
              )}
              {isAdmin && tier.id === 'elite' && !isCurrent && (
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#f0b429] bg-[#f0b429]/10 px-2 py-0.5 rounded-full">
                  <Crown size={10} /> Admin
                </span>
              )}

              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={tier.accent} />
                <h3 className="font-bold text-foreground">{tier.name}</h3>
              </div>
              <p className="text-xs text-muted">{tier.tagline}</p>
              <p className="text-lg font-bold font-num mt-1.5">{tier.price}</p>

              <ul className="mt-3 space-y-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted">
                    <Check size={11} className="mt-0.5 shrink-0 text-muted/50" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                {unlocked ? (
                  isCurrent ? (
                    <div className="w-full py-2 text-xs font-semibold text-center text-muted">
                      {activeTier === tier.id ? 'Your plan' : 'Previewing'}
                    </div>
                  ) : (
                    <div className="w-full py-2 text-xs font-semibold text-center text-muted">Included</div>
                  )
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startPreview(tier.id)}
                      disabled={!!previewTier}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Preview 30s
                    </button>
                    <Link
                      to="/billing"
                      className={cn('flex-1 py-2 text-xs font-semibold rounded-lg text-white text-center transition-colors',
                        tier.id === 'pro' ? 'bg-[#0a84ff] hover:bg-[#0066cc]' : 'bg-[#a855f7] hover:bg-[#9333ea]'
                      )}
                    >
                      Upgrade
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
