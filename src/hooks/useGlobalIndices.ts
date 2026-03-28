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

const CORS_PROXY = 'https://corsproxy.io/?url=';

async function fetchYahooQuotes(symbols: string[]): Promise<Record<string, GlobalIndex>> {
  const joined = symbols.join(',');
  const url = `${CORS_PROXY}${encodeURIComponent(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName`
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo API error: ${res.status}`);

  const json = await res.json();
  const results: Record<string, GlobalIndex> = {};

  for (const q of json.quoteResponse?.result || []) {
    const sym = q.symbol as string;
    const entry = Object.entries(INDEX_SYMBOLS).find(([, v]) => v.yahoo === sym);
    if (!entry) continue;

    results[entry[0]] = {
      symbol: sym,
      name: entry[0],
      exchange: entry[1].exchange,
      value: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
    };
  }

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
