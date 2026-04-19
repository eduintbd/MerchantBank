import { useQuery } from '@tanstack/react-query';

export interface GlobalIndex {
  symbol: string;
  name: string;
  exchange: string;
  value: number;
  change: number;
  changePct: number;
}

/**
 * Yahoo Finance v8 quote symbols for major indices:
 * ^IXIC  = NASDAQ Composite
 * ^KSE   = KSE-100 (Pakistan)
 * ^BSESN = SENSEX (India)
 * ^CSE   = ASPI (Sri Lanka) — use CSEALL.CMB
 */
const INDEX_SYMBOLS: Record<string, { yahoo: string; exchange: string }> = {
  NASDAQ:  { yahoo: '^IXIC',       exchange: 'NASDAQ' },
  KSE100:  { yahoo: '^KSE',        exchange: 'PSX' },
  SENSEX:  { yahoo: '^BSESN',      exchange: 'BSE' },
  ASPI:    { yahoo: 'CSEALL.CMB',  exchange: 'CSE' },
};

function proxyUrl(url: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

async function fetchChart(symbol: string): Promise<{ price: number; prevClose: number } | null> {
  try {
    const url = proxyUrl(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`);
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return {
      price: meta.regularMarketPrice ?? 0,
      prevClose: meta.chartPreviousClose ?? meta.regularMarketPrice ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchYahooQuotes(symbols: string[]): Promise<Record<string, GlobalIndex>> {
  const results: Record<string, GlobalIndex> = {};

  const fetches = await Promise.allSettled(
    Object.entries(INDEX_SYMBOLS).map(async ([key, val]) => {
      const data = await fetchChart(val.yahoo);
      if (!data || data.price === 0) return;
      const change = data.price - data.prevClose;
      const changePct = data.prevClose > 0 ? (change / data.prevClose) * 100 : 0;
      results[key] = {
        symbol: val.yahoo,
        name: key,
        exchange: val.exchange,
        value: data.price,
        change,
        changePct,
      };
    })
  );

  return results;
}

export function useGlobalIndices() {
  return useQuery<Record<string, GlobalIndex>>({
    queryKey: ['globalIndices'],
    queryFn: () => fetchYahooQuotes(Object.values(INDEX_SYMBOLS).map(v => v.yahoo)),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}
