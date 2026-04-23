import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TierSelector } from '@/components/trading/TierSelector';
import { StarterView } from '@/pages/trading/StarterView';
import { ProView } from '@/pages/trading/ProView';
import { EliteView } from '@/pages/trading/EliteView';
import { useSubscriptionTier, type SubscriptionTier } from '@/hooks/useSubscriptionTier';

export function TradingPage() {
  const { currentView, startPreview, canUse } = useSubscriptionTier();
  const [searchParams, setSearchParams] = useSearchParams();

  // Shareable preview link: /trading?preview=pro starts a 30s preview automatically.
  useEffect(() => {
    const requested = searchParams.get('preview') as SubscriptionTier | null;
    if (!requested || !['starter', 'pro', 'elite'].includes(requested)) return;
    if (!canUse(requested)) startPreview(requested);
    // Strip the param so refreshes don't re-trigger the timer.
    const next = new URLSearchParams(searchParams);
    next.delete('preview');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <TierSelector />
        {currentView === 'starter' && <StarterView />}
        {currentView === 'pro' && <ProView />}
        {currentView === 'elite' && <EliteView />}
        <div className="h-16 sm:h-4" />
      </div>
    </div>
  );
}
