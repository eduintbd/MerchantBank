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

const CORS_PROXY = 'https://corsproxy.io/?url=';

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

async function fetchYahooQuotes(symbols: string[]): Promise<any[]> {
  const joined = symbols.join(',');
  const url = `${CORS_PROXY}${encodeURIComponent(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName`
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo API error: ${res.status}`);
  const json = await res.json();
  return json.quoteResponse?.result || [];
}

export function useGlobalMarkets() {
  return useQuery<GlobalMarketIndex[]>({
    queryKey: ['globalMarkets'],
    queryFn: async () => {
      const symbols = GLOBAL_INDICES.map(i => i.yahoo);
      const quotes = await fetchYahooQuotes(symbols);
      return GLOBAL_INDICES.map(idx => {
        const q = quotes.find((q: any) => q.symbol === idx.yahoo);
        return {
          symbol: idx.yahoo,
          name: idx.name,
          region: idx.region,
          value: q?.regularMarketPrice ?? 0,
          change: q?.regularMarketChange ?? 0,
          changePct: q?.regularMarketChangePercent ?? 0,
        };
      }).filter(i => i.value > 0);
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
      const symbols = COMMODITIES.map(c => c.yahoo);
      const quotes = await fetchYahooQuotes(symbols);
      return COMMODITIES.map(com => {
        const q = quotes.find((q: any) => q.symbol === com.yahoo);
        return {
          symbol: com.yahoo,
          name: com.name,
          price: q?.regularMarketPrice ?? 0,
          change: q?.regularMarketChange ?? 0,
          changePct: q?.regularMarketChangePercent ?? 0,
          unit: com.unit,
        };
      }).filter(c => c.price > 0);
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
      const symbols = FOREX_PAIRS.map(f => f.yahoo);
      const quotes = await fetchYahooQuotes(symbols);
      return FOREX_PAIRS.map(fx => {
        const q = quotes.find((q: any) => q.symbol === fx.yahoo);
        return {
          pair: fx.pair,
          name: fx.name,
          rate: q?.regularMarketPrice ?? 0,
          change: q?.regularMarketChange ?? 0,
          changePct: q?.regularMarketChangePercent ?? 0,
          flag: fx.flag,
        };
      }).filter(f => f.rate > 0);
    },
    refetchInterval: 300_000,
    staleTime: 120_000,
    retry: 2,
  });
}
