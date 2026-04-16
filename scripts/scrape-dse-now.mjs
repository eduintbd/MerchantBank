#!/usr/bin/env node
// Quick local script to scrape DSE and update Supabase immediately
// Usage: node scripts/scrape-dse-now.mjs

import { createClient } from '@supabase/supabase-js';

const DSE_SUPABASE_URL = process.env.VITE_DSE_SUPABASE_URL;
const DSE_SUPABASE_KEY = process.env.VITE_DSE_SUPABASE_ANON_KEY;

if (!DSE_SUPABASE_URL || !DSE_SUPABASE_KEY) {
  console.error('Missing VITE_DSE_SUPABASE_URL or VITE_DSE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(DSE_SUPABASE_URL, DSE_SUPABASE_KEY);

const DSE_PRICES_URL = 'https://www.dsebd.org/latest_share_price_scroll_l.php';
const DSE_HOME_URL = 'https://www.dsebd.org/';

function parseNumber(text) {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, '').replace(/[^\d.\-]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function scrapeLivePrices() {
  console.log('Fetching DSE prices page...');
  const res = await fetch(DSE_PRICES_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) throw new Error(`DSE prices page returned ${res.status}`);
  const html = await res.text();
  console.log(`Fetched ${html.length} bytes`);

  const prices = [];
  const now = new Date().toISOString();

  // Parse <tr> rows that have exactly 11 <td> cells (the price table)
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  const seen = new Set();

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];

    // Extract cells from this row
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const content = tdMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .trim();
      cells.push(content);
    }

    // Must have exactly 11 columns: #, CODE, LTP, HIGH, LOW, CLOSEP, YCP, CHANGE, TRADE, VALUE, VOLUME
    if (cells.length !== 11) continue;

    const rowNum = parseNumber(cells[0]);
    if (rowNum <= 0) continue;

    const symbol = cells[1].trim();
    if (!symbol || !/^[A-Z0-9]/.test(symbol)) continue;
    if (seen.has(symbol)) continue;  // skip duplicates
    seen.add(symbol);

    const ltp = parseNumber(cells[2]);
    const high = parseNumber(cells[3]);
    const low = parseNumber(cells[4]);
    const closeP = parseNumber(cells[5]);
    const ycp = parseNumber(cells[6]);
    const change = parseNumber(cells[7]);
    const trades = parseNumber(cells[8]);
    const valueMn = parseNumber(cells[9]);
    const volume = parseNumber(cells[10]);

    if (ltp === 0) continue;
    const changePct = ycp > 0 ? (change / ycp) * 100 : 0;

    prices.push({
      symbol,
      ltp,
      high,
      low,
      open_price: closeP,
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

async function scrapeIndices() {
  console.log('Fetching DSE homepage for indices...');
  const res = await fetch(DSE_HOME_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) throw new Error(`DSE homepage returned ${res.status}`);
  const html = await res.text();
  const now = new Date().toISOString();
  const indices = [];

  const indexVars = {
    'index_value_dsbi': 'DSEX',
    'index_value_dses': 'DSES',
    'index_value_ds30': 'DS30',
  };

  for (const [varName, indexName] of Object.entries(indexVars)) {
    // Extract all quoted strings from the variable assignment
    const multiRegex = new RegExp(`var\\s+${varName}\\s*=\\s*([\\s\\S]*?);`, 's');
    const multiMatch = html.match(multiRegex);
    if (!multiMatch) {
      console.log(`  ${indexName}: variable ${varName} not found`);
      continue;
    }

    const quotedParts = [];
    const quoteRegex = /"([^"]*)"/g;
    let qm;
    while ((qm = quoteRegex.exec(multiMatch[1])) !== null) {
      quotedParts.push(qm[1]);
    }
    const fullData = quotedParts.join('');
    const lines = fullData.split('\\n').filter(l => l.trim());

    if (lines.length === 0) {
      console.log(`  ${indexName}: no data lines`);
      continue;
    }

    // Last line = latest value
    const lastLine = lines[lines.length - 1];
    const lastParts = lastLine.split(',');
    if (lastParts.length < 2) continue;

    const value = parseFloat(lastParts[1]);
    if (isNaN(value) || value <= 0) continue;

    // First line = open value
    const firstLine = lines[0];
    const firstParts = firstLine.split(',');
    const openValue = firstParts.length >= 2 ? parseFloat(firstParts[1]) : value;

    const change = Math.round((value - openValue) * 100) / 100;
    const changePct = openValue > 0 ? Math.round((change / openValue) * 100 * 10000) / 10000 : 0;

    indices.push({ index_name: indexName, value, change, change_pct: changePct, scraped_at: now });
    console.log(`  ${indexName}: ${value} (${change >= 0 ? '+' : ''}${change}, ${changePct}%)`);
  }

  return indices;
}

async function main() {
  console.log('=== DSE Market Data Scraper ===\n');

  const [prices, indices] = await Promise.all([
    scrapeLivePrices(),
    scrapeIndices(),
  ]);

  console.log(`\nScraped ${prices.length} stocks, ${indices.length} indices`);

  if (prices.length > 0) {
    console.log(`\nSample: ${prices[0].symbol} LTP=${prices[0].ltp} CHG=${prices[0].change}`);
    console.log(`        ${prices[prices.length - 1].symbol} LTP=${prices[prices.length - 1].ltp}`);
  }

  // Update prices by symbol
  if (prices.length > 0) {
    console.log('\nUpdating prices in Supabase...');
    let updated = 0;
    let failed = 0;
    for (const p of prices) {
      const { symbol, ...fields } = p;
      const { error } = await supabase
        .from('live_prices')
        .update(fields)
        .eq('symbol', symbol);
      if (error) {
        failed++;
        if (failed <= 3) console.error(`  ${symbol} error:`, error.message);
      } else {
        updated++;
      }
    }
    console.log(`  Updated: ${updated}, Failed: ${failed}`);
  }

  // Update indices
  if (indices.length > 0) {
    console.log('\nUpdating indices...');
    for (const idx of indices) {
      const { error } = await supabase
        .from('market_indices')
        .update({
          value: idx.value,
          change: idx.change,
          change_pct: idx.change_pct,
          scraped_at: idx.scraped_at,
        })
        .eq('index_name', idx.index_name);

      if (error) {
        console.error(`  ${idx.index_name} error:`, error.message);
      } else {
        console.log(`  ${idx.index_name}: updated to ${idx.value}`);
      }
    }
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
