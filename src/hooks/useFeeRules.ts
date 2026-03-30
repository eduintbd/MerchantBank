import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { calculateCharges, DEFAULT_FEE_RULES } from '@/services/feeCalculator';
import type { FeeRule, ChargesEstimate, DemoOrderSide } from '@/types/demo';

// ── Query: Fetch active fee rules (falls back to defaults) ──

export function useFeeRules() {
  return useQuery({
    queryKey: ['fee-rules'],
    queryFn: async (): Promise<FeeRule[]> => {
      const { data, error } = await supabase
        .from('fee_rules')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error || !data || data.length === 0) {
        return DEFAULT_FEE_RULES;
      }

      return data as FeeRule[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — fee rules rarely change
  });
}

// ── Hook: Estimate charges for a given amount and side ──

export function useEstimateCharges(
  grossAmount: number | undefined,
  side: DemoOrderSide | undefined
): ChargesEstimate | null {
  const { data: feeRules } = useFeeRules();

  if (!grossAmount || !side || grossAmount <= 0 || !feeRules) {
    return null;
  }

  return calculateCharges(grossAmount, side, feeRules);
}
