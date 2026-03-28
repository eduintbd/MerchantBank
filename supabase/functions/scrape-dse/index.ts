// Supabase Edge Function: scrape-dse
// Scrapes DSE (Dhaka Stock Exchange) live prices and market indices
// Runs every 5 minutes via pg_cron during market hours
//
// Deploy: supabase functions deploy scrape-dse
// Cron:   See supabase-dse-cron-setup.sql

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// DSE Supabase credentials — set via: supabase secrets set DSE_SUPABASE_URL=... DSE_SUPABASE_KEY=...
const DSE_URL = Deno.env.get('DSE_SUPABASE_URL')!;
const DSE_KEY = Deno.env.get('DSE_SUPABASE_KEY')!;

const supabase = createClient(DSE_URL, DSE_KEY);

const DSE_PRICES_URL = 'https://www.dsebd.org/latest_share_price_scroll_l.php';
const DSE_HOME_URL = 'https://www.dsebd.org/';

interface LivePrice {
  symbol: string;
  ltp: number;
  high: number;
  low: number;
  open: number;
  close_prev: number;
  change: number;
  change_pct: number;
  volume: number;
  value_traded: number;
  trades: number;
  scraped_at: string;
}

interface MarketIndex {
  index_name: string;
  value: number;
  change: number;
  change_pct: number;
  scraped_at: string;
}

function parseNumber(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, '').replace(/[^\d.\-]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function scrapeLivePrices(): Promise<LivePrice[]> {
  const res = await fetch(DSE_PRICES_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) throw new Error(`DSE prices page returned ${res.status}`);
  const html = await res.text();

  const prices: LivePrice[] = [];
  const now = new Date().toISOString();
  const seen = new Set<string>();

  // Parse <tr> rows with exactly 11 <td> cells
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(
        tdMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').trim()
      );
    }

    if (cells.length !== 11) continue;

    const rowNum = parseNumber(cells[0]);
    if (rowNum <= 0) continue;

    const symbol = cells[1].trim();
    if (!symbol || !/^[A-Z0-9]/.test(symbol) || seen.has(symbol)) continue;
    seen.add(symbol);

    const ltp = parseNumber(cells[2]);
    if (ltp === 0) continue;

    const high = parseNumber(cells[3]);
    const low = parseNumber(cells[4]);
    const closeP = parseNumber(cells[5]);
    const ycp = parseNumber(cells[6]);
    const change = parseNumber(cells[7]);
    const trades = parseNumber(cells[8]);
    const valueMn = parseNumber(cells[9]);
    const volume = parseNumber(cells[10]);
    const changePct = ycp > 0 ? (change / ycp) * 100 : 0;

    prices.push({
      symbol,
      ltp,
      high,
      low,
      open: closeP,
      close_prev: ycp,
      change,
      change_pct: Math.round(changePct * 10000) / 10000,
      volume: Math.round(volume),
      value_traded: Math.round(valueMn * 1_000_000),
      trades: Math.round(trades),
      scraped_at: now,
    });
  }

  return prices;
}

async function scrapeIndices(): Promise<MarketIndex[]> {
  const res = await fetch(DSE_HOME_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) throw new Error(`DSE homepage returned ${res.status}`);
  const html = await res.text();
  const now = new Date().toISOString();
  const indices: MarketIndex[] = [];

  const indexVars: Record<string, string> = {
    'index_value_dsbi': 'DSEX',
    'index_value_dses': 'DSES',
    'index_value_ds30': 'DS30',
  };

  for (const [varName, indexName] of Object.entries(indexVars)) {
    const multiRegex = new RegExp(`var\\s+${varName}\\s*=\\s*([\\s\\S]*?);`, 's');
    const multiMatch = html.match(multiRegex);
    if (!multiMatch) continue;

    const quotedParts: string[] = [];
    const quoteRegex = /"([^"]*)"/g;
    let qm;
    while ((qm = quoteRegex.exec(multiMatch[1])) !== null) {
      quotedParts.push(qm[1]);
    }
    const fullData = quotedParts.join('');
    const lines = fullData.split('\\n').filter((l: string) => l.trim());
    if (lines.length === 0) continue;

    const lastParts = lines[lines.length - 1].split(',');
    if (lastParts.length < 2) continue;
    const value = parseFloat(lastParts[1]);
    if (isNaN(value) || value <= 0) continue;

    const firstParts = lines[0].split(',');
    const openValue = firstParts.length >= 2 ? parseFloat(firstParts[1]) : value;
    const change = Math.round((value - openValue) * 100) / 100;
    const changePct = openValue > 0 ? Math.round((change / openValue) * 100 * 10000) / 10000 : 0;

    indices.push({ index_name: indexName, value, change, change_pct: changePct, scraped_at: now });
  }

  return indices;
}

Deno.serve(async (_req) => {
  try {
    console.log('Starting DSE scrape...');
    const [prices, indices] = await Promise.all([scrapeLivePrices(), scrapeIndices()]);
    console.log(`Scraped ${prices.length} prices, ${indices.length} indices`);

    let priceCount = 0;
    let priceError: string | null = null;

    if (prices.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < prices.length; i += BATCH) {
        const { error } = await supabase
          .from('live_prices')
          .upsert(prices.slice(i, i + BATCH), { onConflict: 'symbol' });
        if (error) priceError = error.message;
        else priceCount += prices.slice(i, i + BATCH).length;
      }
    }

    let indexCount = 0;
    let indexError: string | null = null;
    for (const idx of indices) {
      const { error } = await supabase
        .from('market_indices')
        .update({ value: idx.value, change: idx.change, change_pct: idx.change_pct, scraped_at: idx.scraped_at })
        .eq('index_name', idx.index_name);
      if (error) indexError = error.message;
      else indexCount++;
    }

    return new Response(JSON.stringify({
      success: true,
      prices: { count: priceCount, error: priceError },
      indices: { count: indexCount, error: indexError },
      scraped_at: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Scrape failed:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
