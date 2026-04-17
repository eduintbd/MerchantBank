// Supabase Edge Function: broker-webhook
// Receives execution reports (fills) from broker(s) via POST webhook
// Validates HMAC signature, deduplicates, inserts into broker_executions
//
// Deploy: supabase functions deploy broker-webhook
// Broker configures: POST https://<project>.supabase.co/functions/v1/broker-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyHmac(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === signature.toLowerCase();
}

interface ExecutionReport {
  exec_id: string;
  broker_order_id?: string;
  abaci_order_id?: string;
  client_code: string;
  symbol: string;
  isin?: string;
  exchange?: string;
  side: 'BUY' | 'SELL';
  exec_type: 'FILL' | 'PARTIAL_FILL' | 'CANCEL' | 'REJECT';
  exec_qty: number;
  exec_price: number;
  gross_value: number;
  commission?: number;
  exchange_fee?: number;
  cdbl_fee?: number;
  ait?: number;
  other_charges?: number;
  net_value: number;
  trade_date: string;
  settlement_date?: string;
  exec_time?: string;
  cum_qty?: number;
  leaves_qty?: number;
  category?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const brokerCode = new URL(req.url).searchParams.get('broker');
  if (!brokerCode) {
    return new Response(JSON.stringify({ error: 'Missing broker parameter' }), { status: 400 });
  }

  const { data: broker } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('broker_code', brokerCode)
    .single();

  if (!broker) {
    return new Response(JSON.stringify({ error: 'Unknown broker' }), { status: 404 });
  }

  const bodyText = await req.text();

  if (broker.webhook_secret) {
    const signature = req.headers.get('X-Broker-Signature') || req.headers.get('X-Signature') || '';
    const valid = await verifyHmac(bodyText, signature, broker.webhook_secret);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }
  }

  let reports: ExecutionReport[];
  try {
    const parsed = JSON.parse(bodyText);
    reports = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const results = { received: 0, duplicates: 0, errors: 0, details: [] as string[] };

  for (const report of reports) {
    if (!report.exec_id || !report.client_code || !report.symbol) {
      results.errors++;
      results.details.push(`Missing required fields in exec ${report.exec_id || 'unknown'}`);
      continue;
    }

    const { data: existing } = await supabase
      .from('broker_executions')
      .select('id')
      .eq('broker_id', broker.id)
      .eq('exec_id', report.exec_id)
      .single();

    if (existing) {
      results.duplicates++;
      continue;
    }

    let clientId: string | null = null;
    let portfolioId: string | null = null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .or(`bo_account.eq.${report.client_code},client_code.eq.${report.client_code}`)
      .single();

    if (profile) {
      clientId = profile.id;
      const { data: portfolio } = await supabase
        .from('client_portfolios')
        .select('id')
        .eq('client_id', profile.id)
        .eq('status', 'active')
        .limit(1)
        .single();
      if (portfolio) portfolioId = portfolio.id;
    }

    const { error } = await supabase.from('broker_executions').insert({
      broker_id: broker.id,
      exec_id: report.exec_id,
      broker_order_id: report.broker_order_id,
      abaci_order_id: report.abaci_order_id,
      client_code: report.client_code,
      client_id: clientId,
      portfolio_id: portfolioId,
      symbol: report.symbol,
      isin: report.isin,
      exchange: report.exchange || 'DSE',
      side: report.side,
      exec_type: report.exec_type,
      exec_qty: report.exec_qty,
      exec_price: report.exec_price,
      gross_value: report.gross_value,
      commission: report.commission || 0,
      exchange_fee: report.exchange_fee || 0,
      cdbl_fee: report.cdbl_fee || 0,
      ait: report.ait || 0,
      other_charges: report.other_charges || 0,
      net_value: report.net_value,
      trade_date: report.trade_date,
      settlement_date: report.settlement_date,
      exec_time: report.exec_time,
      cum_qty: report.cum_qty,
      leaves_qty: report.leaves_qty,
      category: report.category,
      processing_status: 'received',
      source: 'webhook',
      raw_payload: report,
      received_at: new Date().toISOString(),
    });

    if (error) {
      results.errors++;
      results.details.push(`Insert failed for exec ${report.exec_id}: ${error.message}`);
    } else {
      results.received++;
    }
  }

  await supabase.from('broker_connections').update({
    last_heartbeat: new Date().toISOString(),
    last_error: results.errors > 0 ? results.details.join('; ') : null,
  }).eq('id', broker.id);

  return new Response(JSON.stringify({
    success: true,
    received: results.received,
    duplicates: results.duplicates,
    errors: results.errors,
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
