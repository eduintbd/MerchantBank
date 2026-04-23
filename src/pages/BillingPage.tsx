import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Gem, ArrowLeft, Check, Mail, Link2, Copy } from 'lucide-react';
import { useSubscriptionTier, type SubscriptionTier } from '@/hooks/useSubscriptionTier';
import { toast } from 'sonner';

const TIERS: { id: SubscriptionTier; name: string; price: string; icon: typeof Sparkles; highlight: boolean; features: string[] }[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free forever',
    icon: Sparkles,
    highlight: false,
    features: ['Market orders', 'Live DSE/CSE prices', 'Basic watchlist', 'Tap-to-buy amounts'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '৳499 / month',
    icon: TrendingUp,
    highlight: true,
    features: ['Everything in Starter', 'BUY/SELL AI signals', 'Limit & stop orders', 'EOD + CSV reports', 'Advanced filters & sector views'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '৳1,999 / month',
    icon: Gem,
    highlight: false,
    features: ['Everything in Pro', 'TradingView charting', 'Drawing tools & 100+ indicators', 'Price & signal alerts', 'Strategy backtesting', 'Broker API access'],
  },
];

export function BillingPage() {
  const { activeTier } = useSubscriptionTier();
  const [copied, setCopied] = useState<SubscriptionTier | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  async function copyLink(tier: SubscriptionTier) {
    const url = `${origin}/trading?preview=${tier}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(tier);
      toast.success(`Preview link for ${tier} copied`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Could not copy — select and copy manually');
    }
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1100, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Link to="/trading" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-5">
          <ArrowLeft size={14} /> Back to Trade
        </Link>

        <header className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Choose your plan</h1>
          <p className="text-muted text-sm mt-1.5">Unlock more tools as you grow your strategy.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map(t => {
            const isActive = activeTier === t.id;
            const Icon = t.icon;
            return (
              <div key={t.id} className={`relative rounded-2xl border p-5 sm:p-6 ${t.highlight ? 'border-[#0a84ff]/40 bg-gradient-to-b from-[#0a84ff]/5 to-transparent shadow-[0_4px_20px_rgba(10,132,255,0.1)]' : 'border-border bg-card-solid'}`}>
                {t.highlight && (
                  <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#0a84ff] px-2 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={18} className={t.id === 'starter' ? 'text-[#00b386]' : t.id === 'pro' ? 'text-[#0a84ff]' : 'text-[#a855f7]'} />
                  <h3 className="font-bold text-lg">{t.name}</h3>
                </div>
                <p className="text-2xl font-bold font-num mt-2 mb-4">{t.price}</p>
                <ul className="space-y-2 mb-6">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#00b386]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <div className="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-foreground/5 text-muted">
                    Your current plan
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 text-sm font-bold rounded-xl bg-foreground text-background disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Upgrade (coming soon)
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
              <Mail size={16} className="text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Billing isn't live yet</h3>
              <p className="text-xs text-muted leading-relaxed">
                Payment processing (SSLCommerz / Stripe) will be wired up shortly. In the meantime,
                email <a className="text-info hover:underline" href="mailto:abaci.support@aibd.ai">abaci.support@aibd.ai</a> to get early access to Pro or Elite.
              </p>
            </div>
          </div>
        </div>

        {/* Shareable preview links */}
        <div className="mt-5 p-5 rounded-2xl border border-border bg-card-solid">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#a855f7]/10 flex items-center justify-center shrink-0">
              <Link2 size={16} className="text-[#a855f7]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-0.5">Share a preview link</h3>
              <p className="text-xs text-muted">
                Anyone who opens one of these URLs gets a free 30-second preview of that tier.
                Great for showing prospects what they'd unlock.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {(['pro', 'elite'] as SubscriptionTier[]).map(tier => {
              const url = `${origin}/trading?preview=${tier}`;
              return (
                <div key={tier} className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider w-14 shrink-0 text-muted">{tier}</span>
                  <input
                    readOnly
                    value={url}
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    onFocus={e => e.target.select()}
                  />
                  <button
                    onClick={() => copyLink(tier)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-surface transition-colors"
                  >
                    {copied === tier ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
