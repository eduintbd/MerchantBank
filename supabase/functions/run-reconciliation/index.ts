// Supabase Edge Function: run-reconciliation
// Runs daily position reconciliation: Abaci holdings vs broker positions
// Can be triggered manually or via pg_cron at 16:00 BST
//
// Deploy: supabase functions deploy run-reconciliation
// Usage: POST /functions/v1/run-reconciliation?date=2026-04-17&broker=UCB

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TOLERANCE = {
  qty: 0,        // exact match
  avg_cost: 0.10, // BDT 0.10 rounding tolerance
  value: 1.00,   // BDT 1.00 rounding tolerance
};

interface AbaciHolding {
  portfolio_id: string;
  client_id: string;
  symbol: string;
  quantity: number;
  avg_cost: number;
  market_value: number;
}

interface BrokerPosition {
  client_code: string;
  symbol: string;
  total_qty: number;
  avg_cost: number;
  market_value: number;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const url = new URL(req.url);
  const reconDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const brokerCode = url.searchParams.get('broker');
  const reconType = (url.searchParams.get('type') || 'position') as 'position' | 'trade';
  const triggeredBy = url.searchParams.get('user_id');

  let brokerId: string | null = null;
  if (brokerCode) {
    const { data: broker } = await supabase
      .from('broker_connections')
      .select('id')
      .eq('broker_code', brokerCode)
      .single();
    brokerId = broker?.id || null;
  }

  const { data: run, error: runErr } = await supabase
    .from('reconciliation_runs')
    .insert({
      broker_id: brokerId,
      recon_date: reconDate,
      recon_type: reconType,
      status: 'running',
      triggered_by: triggeredBy,
      data_source: 'internal',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (runErr || !run) {
    return new Response(JSON.stringify({ error: 'Failed to create recon run' }), { status: 500 });
  }

  try {
    if (reconType === 'position') {
      await runPositionRecon(run.id, reconDate, brokerId);
    } else {
      await runTradeRecon(run.id, reconDate, brokerId);
    }

    const { data: items } = await supabase
      .from('reconciliation_items')
      .select('match_status, value_diff')
      .eq('recon_run_id', run.id);

    const totals = {
      total_items: items?.length || 0,
      matched: items?.filter(i => i.match_status === 'matched').length || 0,
      mismatched: items?.filter(i => !['matched', 'missing_abaci', 'missing_broker'].includes(i.match_status)).length || 0,
      missing_abaci: items?.filter(i => i.match_status === 'missing_abaci').length || 0,
      missing_broker: items?.filter(i => i.match_status === 'missing_broker').length || 0,
      total_discrepancy_value: items?.reduce((s, i) => s + Math.abs(i.value_diff || 0), 0) || 0,
    };

    const completedAt = new Date().toISOString();
    await supabase.from('reconciliation_runs').update({
      ...totals,
      status: 'completed',
      completed_at: completedAt,
      duration_seconds: Math.round((new Date(completedAt).getTime() - new Date(run.started_at).getTime()) / 1000),
    }).eq('id', run.id);

    return new Response(JSON.stringify({
      success: true,
      run_id: run.id,
      date: reconDate,
      ...totals,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    await supabase.from('reconciliation_runs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      summary: { error: err instanceof Error ? err.message : 'Unknown error' },
    }).eq('id', run.id);

    return new Response(JSON.stringify({
      success: false,
      run_id: run.id,
      error: err instanceof Error ? err.message : 'Reconciliation failed',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

async function runPositionRecon(runId: string, date: string, brokerId: string | null) {
  const { data: abaciHoldings } = await supabase
    .from('portfolio_holdings')
    .select('portfolio_id, client_id, symbol, quantity, avg_cost, market_value')
    .gt('quantity', 0);

  const holdings = (abaciHoldings || []) as AbaciHolding[];

  const execQuery = supabase
    .from('broker_executions')
    .select('client_code, client_id, symbol, exec_qty, exec_price, gross_value, side')
    .eq('trade_date', date)
    .eq('processing_status', 'applied');
  if (brokerId) execQuery.eq('broker_id', brokerId);

  const { data: brokerExecs } = await execQuery;

  const brokerPositions = new Map<string, BrokerPosition>();
  for (const exec of (brokerExecs || [])) {
    const key = `${exec.client_id || exec.client_code}:${exec.symbol}`;
    if (!brokerPositions.has(key)) {
      brokerPositions.set(key, {
        client_code: exec.client_code,
        symbol: exec.symbol,
        total_qty: 0,
        avg_cost: 0,
        market_value: 0,
      });
    }
  }

  const abaciMap = new Map<string, AbaciHolding>();
  for (const h of holdings) {
    const key = `${h.client_id}:${h.symbol}`;
    abaciMap.set(key, h);
  }

  const allKeys = new Set([...abaciMap.keys(), ...brokerPositions.keys()]);
  const items: Record<string, unknown>[] = [];

  for (const key of allKeys) {
    const abaci = abaciMap.get(key);
    const broker = brokerPositions.get(key);
    const [clientId, symbol] = key.split(':');

    let matchStatus: string;
    let qtyDiff = 0;
    let valueDiff = 0;
    let costDiff = 0;

    if (abaci && !broker) {
      matchStatus = 'missing_broker';
      qtyDiff = abaci.quantity;
      valueDiff = abaci.market_value;
    } else if (!abaci && broker) {
      matchStatus = 'missing_abaci';
      qtyDiff = -broker.total_qty;
      valueDiff = -broker.market_value;
    } else if (abaci && broker) {
      qtyDiff = abaci.quantity - broker.total_qty;
      costDiff = abaci.avg_cost - broker.avg_cost;
      valueDiff = abaci.market_value - broker.market_value;

      if (Math.abs(qtyDiff) > TOLERANCE.qty) {
        matchStatus = 'qty_mismatch';
      } else if (Math.abs(costDiff) > TOLERANCE.avg_cost) {
        matchStatus = 'cost_mismatch';
      } else if (Math.abs(valueDiff) > TOLERANCE.value) {
        matchStatus = 'value_mismatch';
      } else {
        matchStatus = 'matched';
      }
    } else {
      continue;
    }

    items.push({
      recon_run_id: runId,
      item_type: 'holding',
      client_id: clientId,
      symbol,
      match_status: matchStatus,
      abaci_qty: abaci?.quantity,
      abaci_avg_cost: abaci?.avg_cost,
      abaci_value: abaci?.market_value,
      broker_qty: broker?.total_qty,
      broker_avg_cost: broker?.avg_cost,
      broker_value: broker?.market_value,
      qty_diff: qtyDiff,
      value_diff: valueDiff,
      cost_diff: costDiff,
      resolution_status: matchStatus === 'matched' ? 'resolved' : 'open',
    });
  }

  if (items.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < items.length; i += batchSize) {
      await supabase.from('reconciliation_items').insert(items.slice(i, i + batchSize));
    }
  }
}

async function runTradeRecon(runId: string, date: string, brokerId: string | null) {
  const { data: abaciTxns } = await supabase
    .from('portfolio_transactions')
    .select('id, client_id, symbol, transaction_type, quantity, price, net_value, broker_ref')
    .eq('trade_date', date)
    .in('transaction_type', ['buy', 'sell']);

  const execQuery = supabase
    .from('broker_executions')
    .select('id, client_id, client_code, symbol, side, exec_qty, exec_price, net_value, exec_id')
    .eq('trade_date', date);
  if (brokerId) execQuery.eq('broker_id', brokerId);

  const { data: brokerExecs } = await execQuery;

  const abaciByRef = new Map<string, typeof abaciTxns extends (infer T)[] | null ? T : never>();
  for (const t of (abaciTxns || [])) {
    if (t.broker_ref) abaciByRef.set(t.broker_ref, t);
  }

  const items: Record<string, unknown>[] = [];

  for (const exec of (brokerExecs || [])) {
    const matched = abaciByRef.get(exec.exec_id);

    if (matched) {
      const qtyDiff = matched.quantity - exec.exec_qty;
      const priceDiff = matched.price - exec.exec_price;
      const valueDiff = matched.net_value - exec.net_value;

      const matchStatus = Math.abs(qtyDiff) > 0 ? 'qty_mismatch'
        : Math.abs(priceDiff) > 0.01 ? 'price_mismatch'
        : Math.abs(valueDiff) > TOLERANCE.value ? 'value_mismatch'
        : 'matched';

      items.push({
        recon_run_id: runId,
        item_type: 'trade',
        client_id: exec.client_id,
        symbol: exec.symbol,
        match_status: matchStatus,
        abaci_qty: matched.quantity,
        abaci_price: matched.price,
        abaci_value: matched.net_value,
        broker_qty: exec.exec_qty,
        broker_price: exec.exec_price,
        broker_value: exec.net_value,
        qty_diff: qtyDiff,
        value_diff: valueDiff,
        cost_diff: priceDiff,
        abaci_ref_id: matched.id,
        broker_ref_id: exec.id,
        resolution_status: matchStatus === 'matched' ? 'resolved' : 'open',
      });
      abaciByRef.delete(exec.exec_id);
    } else {
      items.push({
        recon_run_id: runId,
        item_type: 'trade',
        client_id: exec.client_id,
        client_code: exec.client_code,
        symbol: exec.symbol,
        match_status: 'missing_abaci',
        broker_qty: exec.exec_qty,
        broker_price: exec.exec_price,
        broker_value: exec.net_value,
        qty_diff: -exec.exec_qty,
        value_diff: -exec.net_value,
        broker_ref_id: exec.id,
        resolution_status: 'open',
      });
    }
  }

  for (const [, txn] of abaciByRef) {
    items.push({
      recon_run_id: runId,
      item_type: 'trade',
      client_id: txn.client_id,
      symbol: txn.symbol,
      match_status: 'missing_broker',
      abaci_qty: txn.quantity,
      abaci_price: txn.price,
      abaci_value: txn.net_value,
      qty_diff: txn.quantity,
      value_diff: txn.net_value,
      abaci_ref_id: txn.id,
      resolution_status: 'open',
    });
  }

  if (items.length > 0) {
    await supabase.from('reconciliation_items').insert(items);
  }
}
