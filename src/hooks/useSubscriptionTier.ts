import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionTier = 'starter' | 'pro' | 'elite';
export const TIER_ORDER: Record<SubscriptionTier, number> = { starter: 0, pro: 1, elite: 2 };

const PREVIEW_MS = 30_000;

export function useSubscriptionTier() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  // Admins/managers implicitly have elite access.
  const activeTier: SubscriptionTier =
    isAdmin ? 'elite' : ((user as any)?.subscription_tier as SubscriptionTier) || 'starter';

  // previewTier lets a user temporarily try a higher tier.
  const [previewTier, setPreviewTierState] = useState<SubscriptionTier | null>(null);
  const [previewRemaining, setPreviewRemaining] = useState(0);

  useEffect(() => {
    if (!previewTier) return;
    setPreviewRemaining(PREVIEW_MS);
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = PREVIEW_MS - elapsed;
      if (remaining <= 0) {
        clearInterval(iv);
        setPreviewTierState(null);
        setPreviewRemaining(0);
      } else {
        setPreviewRemaining(remaining);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [previewTier]);

  function startPreview(tier: SubscriptionTier) {
    if (TIER_ORDER[tier] <= TIER_ORDER[activeTier]) return;
    setPreviewTierState(tier);
  }
  function stopPreview() {
    setPreviewTierState(null);
  }

  const currentView: SubscriptionTier = previewTier ?? activeTier;
  const canUse = (tier: SubscriptionTier) => TIER_ORDER[activeTier] >= TIER_ORDER[tier];

  async function setTier(tier: SubscriptionTier) {
    if (!user?.id) return { error: 'Not signed in' };
    const { error } = await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', user.id);
    if (error) return { error: error.message };
    qc.invalidateQueries({ queryKey: ['profile'] });
    return {};
  }

  return {
    activeTier,
    currentView,
    previewTier,
    previewRemaining,
    startPreview,
    stopPreview,
    canUse,
    setTier,
    isAdmin,
  };
}
