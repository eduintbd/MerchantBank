import { useQuery } from '@tanstack/react-query';

export interface GlobalMarketIndex {
  symbol: string;
  name: string;
  region: string;
  value: number;
  change: number;
  changePct: number;
}

export interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  unit: string;
}

export interface ForexRate {
  pair: string;
  name: string;
  rate: number;
  change: number;
  changePct: number;
  flag: string;
}

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

/* ─── Global Indices ─── */
const GLOBAL_INDICES = [
  { yahoo: '^GSPC', name: 'S&P 500', region: 'US' },
  { yahoo: '^IXIC', name: 'NASDAQ', region: 'US' },
  { yahoo: '^DJI', name: 'Dow Jones', region: 'US' },
  { yahoo: '^FTSE', name: 'FTSE 100', region: 'UK' },
  { yahoo: '^N225', name: 'Nikkei 225', region: 'Japan' },
  { yahoo: '^HSI', name: 'Hang Seng', region: 'HK' },
  { yahoo: '^BSESN', name: 'SENSEX', region: 'India' },
  { yahoo: '000001.SS', name: 'Shanghai', region: 'China' },
];

export function useGlobalMarkets() {
  return useQuery<GlobalMarketIndex[]>({
    queryKey: ['globalMarkets'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        GLOBAL_INDICES.map(async (idx) => {
          const data = await fetchChart(idx.yahoo);
          if (!data || data.price === 0) return null;
          const change = data.price - data.prevClose;
          const changePct = data.prevClose > 0 ? (change / data.prevClose) * 100 : 0;
          return {
            symbol: idx.yahoo,
            name: idx.name,
            region: idx.region,
            value: data.price,
            change,
            changePct,
          };
        })
      );
      return results
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter((r): r is GlobalMarketIndex => r !== null);
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 2,
  });
}

/* ─── Commodities ─── */
const COMMODITIES = [
  { yahoo: 'GC=F', name: 'Gold', unit: 'USD/oz' },
  { yahoo: 'SI=F', name: 'Silver', unit: 'USD/oz' },
  { yahoo: 'CL=F', name: 'Crude Oil', unit: 'USD/bbl' },
  { yahoo: 'NG=F', name: 'Natural Gas', unit: 'USD/MMBtu' },
  { yahoo: 'HG=F', name: 'Copper', unit: 'USD/lb' },
  { yahoo: 'PL=F', name: 'Platinum', unit: 'USD/oz' },
];

export function useCommodities() {
  return useQuery<CommodityPrice[]>({
    queryKey: ['commodities'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        COMMODITIES.map(async (com) => {
          const data = await fetchChart(com.yahoo);
          if (!data || data.price === 0) return null;
          const change = data.price - data.prevClose;
          const changePct = data.prevClose > 0 ? (change / data.prevClose) * 100 : 0;
          return {
            symbol: com.yahoo,
            name: com.name,
            price: data.price,
            change,
            changePct,
            unit: com.unit,
          };
        })
      );
      return results
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter((r): r is CommodityPrice => r !== null);
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 2,
  });
}

/* ─── Forex (against BDT) ─── */
const FOREX_PAIRS = [
  { yahoo: 'USDBDT=X', pair: 'USD/BDT', name: 'US Dollar', flag: '🇺🇸' },
  { yahoo: 'EURBDT=X', pair: 'EUR/BDT', name: 'Euro', flag: '🇪🇺' },
  { yahoo: 'GBPBDT=X', pair: 'GBP/BDT', name: 'British Pound', flag: '🇬🇧' },
  { yahoo: 'INRBDT=X', pair: 'INR/BDT', name: 'Indian Rupee', flag: '🇮🇳' },
  { yahoo: 'JPYBDT=X', pair: 'JPY/BDT', name: 'Japanese Yen', flag: '🇯🇵' },
  { yahoo: 'SARBDT=X', pair: 'SAR/BDT', name: 'Saudi Riyal', flag: '🇸🇦' },
  { yahoo: 'AEDBDT=X', pair: 'AED/BDT', name: 'UAE Dirham', flag: '🇦🇪' },
  { yahoo: 'CNYBDT=X', pair: 'CNY/BDT', name: 'Chinese Yuan', flag: '🇨🇳' },
];

export function useForexRates() {
  return useQuery<ForexRate[]>({
    queryKey: ['forexRates'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        FOREX_PAIRS.map(async (fx) => {
          const data = await fetchChart(fx.yahoo);
          if (!data || data.price === 0) return null;
          const price = data.price;
          const change = price - data.prevClose;
          const changePct = data.prevClose > 0 ? (change / data.prevClose) * 100 : 0;
          return {
            pair: fx.pair,
            name: fx.name,
            rate: price,
            change,
            changePct,
            flag: fx.flag,
          };
        })
      );
      return results
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter((r): r is ForexRate => r !== null);
    },
    refetchInterval: 300_000,
    staleTime: 120_000,
    retry: 2,
  });
}
