import type { FeeRule, FeeBreakdown, ChargesEstimate } from '@/types/demo';

/**
 * Calculate fees for a given trade amount using active fee rules.
 */
export function calculateCharges(
  grossAmount: number,
  side: 'BUY' | 'SELL',
  feeRules: FeeRule[]
): ChargesEstimate {
  const fees: FeeBreakdown[] = [];
  let totalCharges = 0;

  for (const rule of feeRules) {
    if (!rule.is_active) continue;

    let amount = 0;
    if (rule.rate_type === 'percentage') {
      amount = grossAmount * (rule.rate_value / 100);
    } else {
      amount = rule.rate_value;
    }

    // Apply min/max bounds
    amount = Math.max(amount, rule.min_amount);
    amount = Math.min(amount, rule.max_amount);
    amount = Math.round(amount * 100) / 100;

    fees.push({ rule, amount });
    totalCharges += amount;
  }

  totalCharges = Math.round(totalCharges * 100) / 100;

  const netAmount = side === 'BUY'
    ? grossAmount + totalCharges
    : grossAmount - totalCharges;

  return {
    grossAmount,
    fees,
    totalCharges,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}

/**
 * Default Bangladesh fee rules (used when DB rules unavailable).
 */
export const DEFAULT_FEE_RULES: FeeRule[] = [
  { id: '1', name: 'Brokerage Commission', fee_type: 'commission', rate_type: 'percentage', rate_value: 0.30, min_amount: 25, max_amount: 999999999, is_active: true },
  { id: '2', name: 'CDBL Fee', fee_type: 'cdbl', rate_type: 'percentage', rate_value: 0.015, min_amount: 2, max_amount: 999999999, is_active: true },
  { id: '3', name: 'BSEC Fee', fee_type: 'regulatory', rate_type: 'percentage', rate_value: 0.015, min_amount: 1, max_amount: 999999999, is_active: true },
  { id: '4', name: 'AIT', fee_type: 'tax', rate_type: 'percentage', rate_value: 0.05, min_amount: 0, max_amount: 999999999, is_active: true },
];
