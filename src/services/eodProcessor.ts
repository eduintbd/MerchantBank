import { supabase } from '@/lib/supabase';
import type { DemoAccount, EodSummary } from '@/types/demo';

/**
 * Run end-of-day processing for a specific demo account.
 * This is the core differentiator of the platform.
 */
export async function runEodForAccount(account: DemoAccount, businessDate: string): Promise<EodSummary> {
  const accountId = account.id;

  // 1. Expire unfilled LIMIT orders
  const { data: openOrders } = await supabase
    .from('demo_orders')
    .select('*')
    .eq('demo_account_id', accountId)
    .in('status', ['submitted', 'queued', 'partially_filled']);

  let ordersCancelled = 0;
  for (const order of openOrders || []) {
    await supabase.from('demo_orders')
      .update({ status: 'expired', executed_at: new Date().toISOString() })
      .eq('id', order.id);
    ordersCancelled++;
  }

  // 2. Get today's trades
  const todayStart = businessDate + 'T00:00:00Z';
  const todayEnd = businessDate + 'T23:59:59Z';
  const { data: todayTrades } = await supabase
    .from('demo_trades')
    .select('*')
    .eq('demo_account_id', accountId)
    .gte('trade_time', todayStart)
    .lte('trade_time', todayEnd);

  // 3. Get current positions
  const { data: positions } = await supabase
    .from('demo_positions')
    .select('*')
    .eq('demo_account_id', accountId);

  // 4. Get account before snapshot
  const openingCash = account.available_cash;

  // 5. Calculate total charges for the day
  let dayCharges = 0;
  for (const trade of todayTrades || []) {
    dayCharges += trade.total_charges;
  }

  // 6. Calculate holdings changes
  const holdingsChange: EodSummary['holdingsChange'] = [];
  for (const pos of positions || []) {
    const tradesForSymbol = (todayTrades || []).filter(t => t.symbol === pos.symbol);
    if (tradesForSymbol.length > 0) {
      const buyQty = tradesForSymbol.filter(t => t.side === 'BUY').reduce((s, t) => s + Number(t.quantity), 0);
      const sellQty = tradesForSymbol.filter(t => t.side === 'SELL').reduce((s, t) => s + Number(t.quantity), 0);
      holdingsChange.push({
        symbol: pos.symbol,
        qtyBefore: Number(pos.quantity) - buyQty + sellQty,
        qtyAfter: Number(pos.quantity),
        reason: buyQty > 0 && sellQty > 0 ? 'Bought and sold' : buyQty > 0 ? 'Bought' : 'Sold',
      });
    }
  }

  // 7. Refresh account to get latest cash
  const { data: updatedAccount } = await supabase
    .from('demo_accounts')
    .select('available_cash, unrealized_pnl, realized_pnl, market_value')
    .eq('id', accountId)
    .single();

  const closingCash = updatedAccount?.available_cash || openingCash;

  const summary: EodSummary = {
    ordersProcessed: (todayTrades || []).length + ordersCancelled,
    ordersCancelled,
    tradesBooked: (todayTrades || []).length,
    holdingsUpdated: holdingsChange.length,
    chargesPosted: dayCharges,
    openingCash,
    closingCash,
    cashChange: closingCash - openingCash,
    holdingsChange,
    pnlChange: {
      realized: updatedAccount?.realized_pnl || 0,
      unrealized: updatedAccount?.unrealized_pnl || 0,
    },
  };

  return summary;
}

/**
 * Create or get today's EOD run record.
 */
export async function getOrCreateEodRun(businessDate: string) {
  const { data: existing } = await supabase
    .from('eod_runs')
    .select('*')
    .eq('business_date', businessDate)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('eod_runs')
    .insert({ business_date: businessDate, status: 'pending' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save EOD result for an account.
 */
export async function saveEodResult(
  eodRunId: string,
  accountId: string,
  summary: EodSummary,
  portfolioValue: number
) {
  const { error } = await supabase.from('eod_account_results').upsert({
    eod_run_id: eodRunId,
    demo_account_id: accountId,
    portfolio_value: portfolioValue,
    total_charges: summary.chargesPosted,
    unrealized_pnl: summary.pnlChange.unrealized,
    realized_pnl: summary.pnlChange.realized,
    summary_json: summary,
  }, { onConflict: 'eod_run_id,demo_account_id' });

  if (error) throw error;
}

/**
 * Generate and save a daily statement.
 */
export async function generateStatement(
  accountId: string,
  eodRunId: string,
  businessDate: string,
  summary: EodSummary,
  portfolioValue: number
) {
  const totalBuys = summary.holdingsChange
    .filter(h => h.reason.includes('Bought'))
    .reduce((s, h) => s + (h.qtyAfter - h.qtyBefore), 0);

  const totalSells = summary.holdingsChange
    .filter(h => h.reason.includes('Sold'))
    .reduce((s, h) => s + (h.qtyBefore - h.qtyAfter), 0);

  await supabase.from('demo_statements').insert({
    demo_account_id: accountId,
    eod_run_id: eodRunId,
    business_date: businessDate,
    opening_cash: summary.openingCash,
    closing_cash: summary.closingCash,
    total_buys: totalBuys,
    total_sells: totalSells,
    total_charges: summary.chargesPosted,
    portfolio_value: portfolioValue,
    details_json: summary,
  });
}
