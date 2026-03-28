import { Globe, TrendingUp, Building2, Users, BarChart3, Activity } from 'lucide-react';
import { useGlobalIndices } from '@/hooks/useGlobalIndices';
import { useMarketData } from '@/hooks/useMarketData';

/* ─── Exchange key used to map live data ────────────────── */
type ExchangeKey = 'NASDAQ' | 'DSE' | 'PSX' | 'BSE' | 'CSE';

/* Live-index mapping: exchange → globalIndices key */
const LIVE_MAP: Record<ExchangeKey, string | null> = {
  NASDAQ: 'NASDAQ',
  DSE:    null,       // from useMarketData (DSEX)
  PSX:    'KSE100',
  BSE:    'SENSEX',
  CSE:    'ASPI',
};

interface Exchange {
  key: ExchangeKey;
  name: string;
  country: string;
  flag: string;
  founded: number;
  listedCompanies: string;
  marketCap: string;
  indices: string;
  benchmarkIndex: string;
  fallbackLevel: string;
  currency: string;
  globalRank: string;
  keySectors: string;
  retailInvestors: string;
}

const EXCHANGES: Exchange[] = [
  {
    key: 'NASDAQ',
    name: 'NASDAQ',
    country: 'United States',
    flag: '🇺🇸',
    founded: 1971,
    listedCompanies: '~4,075',
    marketCap: '$30.82T',
    indices: 'Nasdaq Composite, Nasdaq-100, Nasdaq Biotechnology',
    benchmarkIndex: 'Nasdaq Composite',
    fallbackLevel: '~18,000+',
    currency: 'USD',
    globalRank: '2nd',
    keySectors: 'Technology, Biotech, Consumer',
    retailInvestors: 'Millions',
  },
  {
    key: 'DSE',
    name: 'DSE',
    country: 'Bangladesh',
    flag: '🇧🇩',
    founded: 1954,
    listedCompanies: '~625',
    marketCap: '~$30B',
    indices: 'DSEX, DSES (Shariah), DS30, CDSET',
    benchmarkIndex: 'DSEX',
    fallbackLevel: '~5,316',
    currency: 'BDT',
    globalRank: '~55th',
    keySectors: 'Banking, Pharma, Textiles, Telecom',
    retailInvestors: '~3.5M BO accounts',
  },
  {
    key: 'PSX',
    name: 'PSX',
    country: 'Pakistan',
    flag: '🇵🇰',
    founded: 1947,
    listedCompanies: '~561',
    marketCap: '$64.83B',
    indices: 'KSE-100, KSE-30, KMI-30, KSE All Share',
    benchmarkIndex: 'KSE-100',
    fallbackLevel: '~156,181',
    currency: 'PKR',
    globalRank: '~40th',
    keySectors: 'Banking, Oil & Gas, Fertilizer, Cement',
    retailInvestors: '~220,000',
  },
  {
    key: 'BSE',
    name: 'BSE',
    country: 'India',
    flag: '🇮🇳',
    founded: 1875,
    listedCompanies: '~5,700',
    marketCap: '$4.79T',
    indices: 'SENSEX (BSE 30), BSE 100, BSE 500, BSE MidCap, BSE SmallCap',
    benchmarkIndex: 'SENSEX',
    fallbackLevel: '~73,000+',
    currency: 'INR',
    globalRank: '6th',
    keySectors: 'Finance, IT, Energy, FMCG',
    retailInvestors: '100M+ demat',
  },
  {
    key: 'CSE',
    name: 'CSE',
    country: 'Sri Lanka',
    flag: '🇱🇰',
    founded: 1985,
    listedCompanies: '~286',
    marketCap: '$15.17B',
    indices: 'ASPI, S&P SL20',
    benchmarkIndex: 'ASPI',
    fallbackLevel: '~22,910',
    currency: 'LKR',
    globalRank: '~60th',
    keySectors: 'Banking, Manufacturing, Telecom',
    retailInvestors: 'Growing base',
  },
];

type RowDef =
  | { label: string; key: keyof Exchange; icon: typeof Globe; type: 'static' }
  | { label: string; key: 'indexLevel'; icon: typeof Globe; type: 'live' };

const ROWS: RowDef[] = [
  { label: 'Country', key: 'country', icon: Globe, type: 'static' },
  { label: 'Founded', key: 'founded', icon: Building2, type: 'static' },
  { label: 'Listed Companies', key: 'listedCompanies', icon: BarChart3, type: 'static' },
  { label: 'Market Cap', key: 'marketCap', icon: TrendingUp, type: 'static' },
  { label: 'All Indices', key: 'indices', icon: BarChart3, type: 'static' },
  { label: 'Benchmark Index', key: 'benchmarkIndex', icon: BarChart3, type: 'static' },
  { label: 'Index Level', key: 'indexLevel', icon: Activity, type: 'live' },
  { label: 'Currency', key: 'currency', icon: Globe, type: 'static' },
  { label: 'Global Rank', key: 'globalRank', icon: Building2, type: 'static' },
  { label: 'Key Sectors', key: 'keySectors', icon: Users, type: 'static' },
  { label: 'Retail Investors', key: 'retailInvestors', icon: Users, type: 'static' },
];

/** Reusable global exchange comparison table – works in both dark (landing) and light (market) themes */
export function GlobalExchangeComparison({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark';
  const { data: globalIndices } = useGlobalIndices();
  const { data: dseData } = useMarketData();

  /** Resolve live index value + change for an exchange */
  function getLive(ex: Exchange): { value: number; changePct: number } | null {
    if (ex.key === 'DSE') {
      const dsex = dseData?.indices.find(i => i.index_name === 'DSEX');
      if (dsex) return { value: dsex.value, changePct: dsex.change_pct };
      return null;
    }
    const mapKey = LIVE_MAP[ex.key];
    if (!mapKey || !globalIndices?.[mapKey]) return null;
    const g = globalIndices[mapKey];
    return { value: g.value, changePct: g.changePct };
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[860px]">
        <thead>
          <tr>
            <th
              className={`text-left px-4 py-3 text-[11px] uppercase tracking-wider font-semibold sticky left-0 z-10 ${
                isDark ? 'text-muted bg-[#f1f3f7]' : 'text-muted bg-surface'
              }`}
            >
              Feature
            </th>
            {EXCHANGES.map(ex => (
              <th
                key={ex.key}
                className={`text-center px-4 py-3 ${isDark ? 'bg-[#f1f3f7]' : 'bg-surface'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl leading-none">{ex.flag}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-foreground' : 'text-foreground'}`}>
                    {ex.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr
              key={row.key}
              className={`border-t ${
                isDark
                  ? 'border-border hover:bg-black/[0.02]'
                  : 'border-border hover:bg-card-hover/30'
              } transition-colors`}
            >
              {/* Row label */}
              <td
                className={`px-4 py-3 text-[12px] font-semibold whitespace-nowrap sticky left-0 z-10 ${
                  isDark ? 'text-muted bg-white' : 'text-muted bg-background'
                } ${i % 2 === 0 ? (isDark ? 'bg-[#f8f9fb]' : 'bg-surface/50') : ''}`}
              >
                <div className="flex items-center gap-2">
                  <row.icon size={12} className={isDark ? 'text-primary' : 'text-primary'} />
                  {row.label}
                  {row.type === 'live' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </td>

              {/* Cell values */}
              {EXCHANGES.map(ex => {
                const stripe = i % 2 === 0 ? (isDark ? 'bg-[#f8f9fb]' : 'bg-surface/50') : '';

                /* ── LIVE INDEX ROW ── */
                if (row.type === 'live') {
                  const live = getLive(ex);
                  const hasLive = live !== null;
                  const value = hasLive ? live.value : 0;
                  const changePct = hasLive ? live.changePct : 0;
                  const isUp = changePct > 0;
                  const isDown = changePct < 0;

                  return (
                    <td key={ex.key} className={`px-3 py-2 text-center ${stripe}`}>
                      {hasLive ? (
                        <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${
                          isUp
                            ? 'bg-green-500/10 border-green-500/25'
                            : isDown
                            ? 'bg-red-500/10 border-red-500/25'
                            : isDark
                            ? 'bg-gray-100 border-gray-200'
                            : 'bg-gray-100 border-gray-200'
                        }`}>
                          <span className={`text-[15px] font-bold font-num tracking-tight ${
                            isDark ? 'text-foreground' : 'text-foreground'
                          }`}>
                            {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[11px] font-bold font-num ${
                            isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {isUp ? '▲' : isDown ? '▼' : '—'} {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-1 px-3 py-2">
                          <span className={`text-[13px] font-num font-medium ${isDark ? 'text-muted' : 'text-muted'}`}>
                            {ex.fallbackLevel}
                          </span>
                          <span className={`text-[9px] ${isDark ? 'text-muted/60' : 'text-muted/60'}`}>offline</span>
                        </div>
                      )}
                    </td>
                  );
                }

                /* ── STATIC ROWS ── */
                const val = String(ex[row.key as keyof Exchange]);
                return (
                  <td
                    key={ex.key}
                    className={`px-4 py-3 text-center text-[12px] font-medium ${stripe} ${
                      row.key === 'marketCap'
                        ? 'font-num font-bold text-foreground'
                        : 'text-foreground/80'
                    }`}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
