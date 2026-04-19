import { useState, useMemo, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { usePortfolio } from '@/hooks/useStocks';
import { useMarketData } from '@/hooks/useMarketData';
import { useLearningProgress } from '@/hooks/useLearning';
import { formatCurrency, formatPercent, formatDateTime, formatVolume, cn } from '@/lib/utils';
import { isDseMarketOpen } from '@/lib/market-hours';
import type { LivePrice, MarketIndex } from '@/types';
import {
  TrendingUp, TrendingDown, Briefcase, GraduationCap, ShieldCheck,
  BarChart2, Wallet, ChevronRight, Activity, Zap, DollarSign,
  Search, Eye, Star, Newspaper, ArrowUpRight, ArrowDownRight,
  Clock, Globe, Flame, Volume2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { GlobalMarketsBar, CommoditiesAndForex, MarketNewsFeed, EnhancedSectorHeatmap, StockHeatmap, DseMarketSummary } from '@/components/dashboard/EnhancedSections';

/* ─── Clean Palette Constants (Groww-inspired) ─── */
const GREEN = '#00b386';
const GREEN_DARK = '#009973';
const RED = '#eb5b3c';
const TEXT_PRIMARY = '#121212';
const TEXT = '#44475b';
const MUTED = '#7c7e8c';
const MUTED_LIGHT = '#a1a3ad';
const BORDER = '#e9e9eb';
const SURFACE = '#f8f8f8';
const BG = '#ffffff';
const BLUE = '#5367ff';

/* ═══════════════════════════════════════════════════════════
   1. STOCK TICKER
   ═══════════════════════════════════════════════════════════ */
function StockTicker({ prices }: { prices: LivePrice[] }) {
  const items = prices.slice(0, 30);
  if (!items.length) return null;
  return (
    <div className="relative overflow-hidden" style={{ background: TEXT_PRIMARY, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
      <div className="flex animate-marquee whitespace-nowrap" style={{ padding: '8px 0' }}>
        {[...items, ...items].map((p, i) => (
          <Link key={`${p.symbol}-${i}`} to={`/stock/${p.symbol}`}
            className="inline-flex items-center gap-1.5 mx-4 text-xs hover:opacity-80 transition-opacity">
            <span className="font-medium text-white/90">{p.symbol}</span>
            <span className="text-white/35 font-num">{p.ltp.toFixed(2)}</span>
            <span className="font-num font-medium"
              style={{ color: p.change_pct > 0 ? '#34d399' : p.change_pct < 0 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
              {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none" style={{ background: `linear-gradient(to right, ${TEXT_PRIMARY}, transparent)` }} />
      <div className="absolute inset-y-0 right-0 w-16 pointer-events-none" style={{ background: `linear-gradient(to left, ${TEXT_PRIMARY}, transparent)` }} />
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .animate-marquee { animation: none; } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. INDEX CARDS (DSEX, DSES, DS30, CASPI)
   ═══════════════════════════════════════════════════════════ */
function IndexOverview({ indices, stats, isMarketOpen, lastUpdated }: {
  indices: MarketIndex[];
  stats: { totalVolume: number; totalValue: number; totalTrades: number; advancers: number; decliners: number; unchanged: number; totalStocks: number };
  isMarketOpen: boolean;
  lastUpdated?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const selected = indices[activeIdx] || indices[0];
  const up = selected.change >= 0;

  return (
    <div className="border rounded-2xl overflow-hidden" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Index Tabs */}
      <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        {indices.map((idx, i) => {
          const isActive = i === activeIdx;
          const idxUp = idx.change >= 0;
          return (
            <button key={idx.index_name} onClick={() => setActiveIdx(i)}
              className={cn('flex-1 px-2 sm:px-5 py-2.5 sm:py-3.5 text-center border-b-2 transition-all min-w-0',
                isActive ? 'bg-white' : 'border-transparent hover:bg-white/60'
              )}
              style={{ borderBottomColor: isActive ? GREEN : 'transparent' }}>
              <div className="text-[10px] sm:text-xs font-medium truncate" style={{ color: MUTED_LIGHT }}>{idx.index_name}</div>
              <div className="text-sm sm:text-base font-bold font-num mt-0.5 truncate" style={{ color: TEXT_PRIMARY }}>
                {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={cn('text-[10px] sm:text-xs font-semibold font-num mt-0.5 truncate')}
                style={{ color: idxUp ? GREEN : RED }}>
                {idxUp ? '+' : ''}{idx.change.toFixed(2)} ({idxUp ? '+' : ''}{idx.change_pct.toFixed(2)}%)
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Index Detail */}
      <div className="p-4 sm:p-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
              <h2 className="text-base sm:text-lg font-bold" style={{ color: TEXT_PRIMARY }}>{selected.index_name} Index</h2>
              <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5')}
                style={{
                  background: isMarketOpen ? 'rgba(0,179,134,0.1)' : 'rgba(235,91,60,0.1)',
                  color: isMarketOpen ? GREEN : RED,
                }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{
                  background: isMarketOpen ? GREEN : RED,
                  boxShadow: isMarketOpen ? `0 0 6px ${GREEN}` : 'none',
                }} />
                {isMarketOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold font-num" style={{ color: TEXT_PRIMARY }}>
                {selected.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-base sm:text-xl font-bold font-num" style={{ color: up ? GREEN : RED }}>
                {up ? '+' : ''}{selected.change.toFixed(2)}
              </span>
              <span className="text-xs sm:text-sm font-bold font-num px-2.5 py-1 rounded-full text-white"
                style={{ background: up ? GREEN : RED }}>
                {up ? '+' : ''}{selected.change_pct.toFixed(2)}%
              </span>
            </div>
            {lastUpdated && (
              <div className="text-xs mt-2.5" style={{ color: MUTED_LIGHT }}>
                As of {formatDateTime(lastUpdated)} &middot; DSE & CSE
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. KEY STATS ROW
   ═══════════════════════════════════════════════════════════ */
function KeyStatsRow({ stats }: { stats: { totalVolume: number; totalValue: number; totalTrades: number; advancers: number; decliners: number } }) {
  const items = [
    { label: 'Volume', value: formatVolume(stats.totalVolume), icon: <BarChart2 size={14} style={{ color: GREEN }} /> },
    { label: 'Value', value: `${(stats.totalValue / 1e9).toFixed(2)}B`, icon: <DollarSign size={14} style={{ color: GREEN }} /> },
    { label: 'Trades', value: formatVolume(stats.totalTrades), icon: <Activity size={14} style={{ color: GREEN }} /> },
    {
      label: 'Adv / Dec', icon: <TrendingUp size={14} style={{ color: GREEN }} />,
      value: '',
      custom: (
        <span className="text-sm sm:text-base font-bold font-num">
          <span style={{ color: GREEN }}>{stats.advancers}</span>
          <span style={{ color: MUTED_LIGHT }} className="mx-1">/</span>
          <span style={{ color: RED }}>{stats.decliners}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.label} className="border rounded-2xl p-3 sm:p-4 bg-white"
          style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            {item.icon}
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: MUTED_LIGHT }}>{item.label}</span>
          </div>
          {item.custom || (
            <div className="text-sm sm:text-base font-bold font-num" style={{ color: TEXT_PRIMARY }}>{item.value}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. MARKET BREADTH + SENTIMENT
   ═══════════════════════════════════════════════════════════ */
function MarketBreadth({ stats }: { stats: { advancers: number; decliners: number; unchanged: number; totalStocks: number } }) {
  const { advancers, decliners, unchanged, totalStocks } = stats;
  const bullPct = totalStocks > 0 ? Math.round((advancers / totalStocks) * 100) : 50;
  let sentiment = 'Neutral', sColor = MUTED;
  if (bullPct >= 65) { sentiment = 'Bullish'; sColor = GREEN; }
  else if (bullPct >= 55) { sentiment = 'Mild Bull'; sColor = GREEN_DARK; }
  else if (bullPct <= 35) { sentiment = 'Bearish'; sColor = RED; }
  else if (bullPct <= 45) { sentiment = 'Mild Bear'; sColor = '#e65100'; }

  const donutData = [
    { name: 'Advancers', value: advancers, color: GREEN },
    { name: 'Decliners', value: decliners, color: RED },
    { name: 'Unchanged', value: unchanged, color: '#dddee1' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Breadth Donut */}
      <div className="border rounded-2xl p-4 sm:p-5 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: TEXT_PRIMARY }}>Market Breadth</h3>
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={2} stroke="#fff">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{totalStocks}</span>
              <span className="text-[9px]" style={{ color: MUTED_LIGHT }}>stocks</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: MUTED }}>{d.name}</span>
                </div>
                <span className="text-xs font-semibold font-num" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment Gauge */}
      <div className="border rounded-2xl p-4 sm:p-5 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: TEXT_PRIMARY }}>Market Sentiment</h3>
        <div className="flex flex-col items-center gap-4 pt-1">
          <span className="text-xl font-bold" style={{ color: sColor }}>{sentiment}</span>
          <div className="w-full">
            <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: '#f0f0f2' }}>
              <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${RED}, #ffa726, ${GREEN})` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md"
                style={{
                  left: `calc(${bullPct}% - 8px)`,
                  background: GREEN,
                  border: '2px solid white',
                  boxShadow: `0 0 8px rgba(0,179,134,0.4)`,
                }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: MUTED_LIGHT }}>
              <span>Bear</span><span>Neutral</span><span>Bull</span>
            </div>
          </div>
          <span className="text-xs" style={{ color: MUTED }}>
            Advancer Ratio: <strong className="font-num" style={{ color: sColor }}>{bullPct}%</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. PORTFOLIO OVERVIEW
   ═══════════════════════════════════════════════════════════ */
function PortfolioOverview({ portfolio, learning }: { portfolio: any; learning: any }) {
  const items = [
    {
      label: 'Portfolio Value',
      val: formatCurrency(portfolio?.current_value || 0),
      sub: portfolio ? `${portfolio.total_profit_loss_percent >= 0 ? '+' : ''}${portfolio.total_profit_loss_percent.toFixed(2)}%` : undefined,
      subUp: portfolio?.total_profit_loss_percent >= 0,
      icon: <Wallet size={16} style={{ color: GREEN }} />,
    },
    {
      label: 'Invested',
      val: formatCurrency(portfolio?.total_invested || 0),
      sub: `${portfolio?.total_stocks || 0} stocks`,
      icon: <Briefcase size={16} style={{ color: BLUE }} />,
    },
    {
      label: 'Day P&L',
      val: formatCurrency(portfolio?.total_profit_loss || 0),
      subUp: portfolio?.total_profit_loss >= 0,
      icon: <TrendingUp size={16} style={{ color: GREEN }} />,
    },
    {
      label: 'Learning',
      val: `${learning?.progressPercent || 0}%`,
      sub: learning?.isQualified ? 'Qualified' : 'In progress',
      icon: <GraduationCap size={16} style={{ color: BLUE }} />,
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(c => (
        <div key={c.label} className="border rounded-2xl p-3 sm:p-4 bg-white"
          style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            {c.icon}
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.06em] truncate" style={{ color: MUTED_LIGHT }}>{c.label}</div>
          </div>
          <div className="text-base sm:text-lg font-bold font-num truncate" style={{ color: TEXT_PRIMARY }}>{c.val}</div>
          {c.sub && (
            <div className={cn('text-xs font-num mt-1')}
              style={{ color: c.subUp === true ? GREEN : c.subUp === false ? RED : MUTED }}>
              {c.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. TOP MOVERS
   ═══════════════════════════════════════════════════════════ */
type MoverTab = 'gainer' | 'loser' | 'volume' | 'value' | 'trade';
const MOVER_TABS: { key: MoverTab; label: string }[] = [
  { key: 'gainer', label: 'Top Gainer' },
  { key: 'loser', label: 'Top Loser' },
  { key: 'volume', label: 'Top Volume' },
  { key: 'value', label: 'Top Value' },
  { key: 'trade', label: 'Top Trade' },
];

function TopMovers({ prices }: { prices: LivePrice[] }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MoverTab>('gainer');
  const rows = useMemo(() => {
    const arr = [...prices];
    switch (tab) {
      case 'gainer': return arr.sort((a, b) => b.change_pct - a.change_pct).slice(0, 10);
      case 'loser': return arr.sort((a, b) => a.change_pct - b.change_pct).slice(0, 10);
      case 'volume': return arr.sort((a, b) => b.volume - a.volume).slice(0, 10);
      case 'value': return arr.sort((a, b) => b.value_traded - a.value_traded).slice(0, 10);
      case 'trade': return arr.sort((a, b) => b.trades - a.trades).slice(0, 10);
    }
  }, [prices, tab]);

  return (
    <div className="border rounded-2xl overflow-hidden" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center overflow-x-auto" style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        {MOVER_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all',
              tab === t.key ? 'bg-white' : 'border-transparent hover:bg-white/60'
            )}
            style={{
              borderBottomColor: tab === t.key ? GREEN : 'transparent',
              color: tab === t.key ? GREEN : MUTED,
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <table className="w-full">
        <thead>
          <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            <th className="w-8 px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: MUTED_LIGHT }}>#</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: MUTED_LIGHT }}>Symbol</th>
            <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: MUTED_LIGHT }}>LTP</th>
            <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: MUTED_LIGHT }}>Chg %</th>
            {(tab === 'volume' || tab === 'trade') && (
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: MUTED_LIGHT }}>
                {tab === 'volume' ? 'Volume' : 'Trades'}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const up = s.change_pct >= 0;
            return (
              <tr key={s.symbol}
                className="cursor-pointer transition-colors hover:bg-[#f8f8f8]"
                style={{ borderBottom: `1px solid #f0f0f2` }}
                onClick={() => navigate(`/stock/${s.symbol}`)}>
                <td className="px-3 py-2.5 text-xs font-num" style={{ color: MUTED_LIGHT }}>{i + 1}</td>
                <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{s.symbol}</td>
                <td className="px-3 py-2.5 text-right font-num font-semibold" style={{ color: TEXT_PRIMARY }}>{s.ltp.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className="font-num font-semibold" style={{ color: up ? GREEN : RED }}>
                    {up ? '+' : ''}{s.change_pct.toFixed(2)}%
                  </span>
                </td>
                {(tab === 'volume' || tab === 'trade') && (
                  <td className="px-3 py-2.5 text-right text-xs font-num" style={{ color: MUTED }}>
                    {tab === 'volume' ? formatVolume(s.volume) : s.trades.toLocaleString()}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   8. ALL STOCKS TABLE
   ═══════════════════════════════════════════════════════════ */
type SortKey = 'symbol' | 'ltp' | 'change_pct' | 'volume' | 'value_traded';
const PAGE_SIZE = 50;

function AllStocksTable({ prices }: { prices: LivePrice[] }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = prices.filter(s => !search || s.symbol.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'symbol') return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
    return sortDir === 'asc' ? (a[sortKey] as number) - (b[sortKey] as number) : (b[sortKey] as number) - (a[sortKey] as number);
  });
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const Th = ({ label, k, right }: { label: string; k: SortKey; right?: boolean }) => (
    <th className={cn('px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] cursor-pointer select-none', right ? 'text-right' : 'text-left')}
      style={{ color: MUTED_LIGHT }}
      onClick={() => handleSort(k)}>
      {label}{sortKey === k && <span className="ml-0.5" style={{ color: GREEN }}>{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>}
    </th>
  );

  return (
    <div className="border rounded-2xl overflow-hidden" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <div className="relative max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED_LIGHT }} />
          <input type="text" placeholder="Search stocks..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white text-sm placeholder:text-[#c7c8ce] focus:outline-none focus:ring-1"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, boxShadow: 'none' }}
            onFocus={e => (e.target.style.borderColor = GREEN)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
        </div>
        <span className="text-xs" style={{ color: MUTED_LIGHT }}>{sorted.length} stocks</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
              <Th label="Symbol" k="symbol" />
              <Th label="LTP" k="ltp" right />
              <Th label="Chg %" k="change_pct" right />
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: MUTED_LIGHT }}>Change</th>
              <Th label="Volume" k="volume" right />
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em] hidden lg:table-cell" style={{ color: MUTED_LIGHT }}>High</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em] hidden lg:table-cell" style={{ color: MUTED_LIGHT }}>Low</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((s, i) => {
              const up = s.change_pct >= 0;
              return (
                <tr key={s.symbol}
                  className="cursor-pointer transition-colors hover:bg-[#f8f8f8]"
                  style={{ borderBottom: '1px solid #f0f0f2' }}
                  onClick={() => navigate(`/stock/${s.symbol}`)}>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{s.symbol}</td>
                  <td className="px-3 py-2.5 text-right font-num font-semibold" style={{ color: TEXT_PRIMARY }}>{s.ltp.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-num font-semibold" style={{ color: up ? GREEN : RED }}>
                      {up ? '+' : ''}{s.change_pct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-num text-xs" style={{ color: up ? GREEN : RED }}>
                    {up ? '+' : ''}{s.change.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-num" style={{ color: MUTED }}>{formatVolume(s.volume)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-num hidden lg:table-cell" style={{ color: MUTED }}>{s.high.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-num hidden lg:table-cell" style={{ color: MUTED }}>{s.low.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
          <span className="text-xs" style={{ color: MUTED_LIGHT }}>
            {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors disabled:opacity-40"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, background: 'white' }}>
              Prev
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors disabled:opacity-40"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, background: 'white' }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   9. QUICK ACTION CARDS
   ═══════════════════════════════════════════════════════════ */
const QUICK_ACTIONS = [
  { to: '/trading', label: 'Trade', desc: 'Buy & sell securities', icon: <Zap size={20} /> },
  { to: '/portfolio', label: 'Portfolio', desc: 'View your holdings', icon: <Briefcase size={20} /> },
  { to: '/kyc', label: 'KYC', desc: 'Account verification', icon: <ShieldCheck size={20} /> },
  { to: '/ipo', label: 'IPO', desc: 'Upcoming offerings', icon: <Star size={20} /> },
  { to: '/social', label: 'Social', desc: 'Market intelligence', icon: <Globe size={20} /> },
  { to: '/learning', label: 'Learn', desc: 'Investor education', icon: <GraduationCap size={20} /> },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {QUICK_ACTIONS.map(item => (
        <Link key={item.to} to={item.to}
          className="group border rounded-2xl p-4 bg-white text-center transition-all hover:shadow-md hover:border-[#00b386]/30"
          style={{ borderColor: BORDER }}>
          <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center transition-colors"
            style={{ background: `rgba(0,179,134,0.08)`, color: GREEN }}>
            {item.icon}
          </div>
          <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{item.label}</div>
          <div className="text-[10px] mt-0.5" style={{ color: MUTED_LIGHT }}>{item.desc}</div>
        </Link>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD (main export)
   ═══════════════════════════════════════════════════════════ */
const DemoDashboard = lazy(() => import('@/components/dashboard/DemoDashboard').then(m => ({ default: m.DemoDashboard })));

export function Dashboard() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { data: portfolio } = usePortfolio();
  const { data: market, isLoading: marketLoading } = useMarketData();
  const { data: learning } = useLearningProgress();

  // Show Demo Dashboard when in demo mode
  if (isDemoMode) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#00b386] border-t-transparent rounded-full animate-spin" /></div>}>
        <DemoDashboard />
      </Suspense>
    );
  }

  const isMarketOpen = isDseMarketOpen(market?.lastUpdated);
  const hasPortfolio = portfolio && (portfolio.current_value > 0 || portfolio.total_invested > 0);

  return (
    <div className="animate-fade-in min-h-screen" style={{ background: BG }}>
      {/* 1. Stock Ticker */}
      {market && <StockTicker prices={market.livePrices} />}

      <div style={{ maxWidth: 1280, margin: '0 auto' }} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-6">

          {/* 2. Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: GREEN }}>
                <span className="font-bold text-sm text-white">A</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: TEXT_PRIMARY }}>
                  Welcome back, {user?.full_name?.split(' ')[0] || 'Investor'}
                </h1>
                <div className="flex items-center gap-2 text-xs" style={{ color: MUTED_LIGHT }}>
                  <Clock size={12} />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span className={cn('hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border')}
                    style={{
                      borderColor: isMarketOpen ? 'rgba(0,179,134,0.3)' : 'rgba(235,91,60,0.3)',
                      background: isMarketOpen ? 'rgba(0,179,134,0.08)' : 'rgba(235,91,60,0.08)',
                      color: isMarketOpen ? GREEN : RED,
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{
                      background: isMarketOpen ? GREEN : RED,
                      boxShadow: isMarketOpen ? `0 0 6px ${GREEN}` : 'none',
                    }} />
                    {isMarketOpen ? 'Market Open' : 'Market Closed'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/trading"
                className="px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all hover:shadow-lg"
                style={{ background: GREEN }}>
                Trade Now
              </Link>
            </div>
          </div>

          {/* Mobile market status badge */}
          <div className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border w-fit"
            style={{
              borderColor: isMarketOpen ? 'rgba(0,179,134,0.3)' : 'rgba(235,91,60,0.3)',
              background: isMarketOpen ? 'rgba(0,179,134,0.08)' : 'rgba(235,91,60,0.08)',
              color: isMarketOpen ? GREEN : RED,
            }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{
              background: isMarketOpen ? GREEN : RED,
              boxShadow: isMarketOpen ? `0 0 6px ${GREEN}` : 'none',
            }} />
            {isMarketOpen ? 'Market Open' : 'Market Closed'}
          </div>

          {/* 3. DSE Index Cards */}
          {marketLoading ? (
            <div className="rounded-2xl h-44" style={{ background: SURFACE }} />
          ) : market && (
            <IndexOverview indices={market.indices} stats={market.stats} isMarketOpen={isMarketOpen} lastUpdated={market.lastUpdated} />
          )}

          {/* 4. DSE Market Summary + Key Stats */}
          {market && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DseMarketSummary stats={market.stats} />
              <KeyStatsRow stats={market.stats} />
            </div>
          )}

          {/* 5. Global Markets Overview */}
          <GlobalMarketsBar />

          {/* 6. Commodities & Forex */}
          <CommoditiesAndForex />

          {/* 7. Market Breadth + Sentiment */}
          {market && <MarketBreadth stats={market.stats} />}

          {/* 8. Portfolio Overview (only if user has data) */}
          {hasPortfolio && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Portfolio Overview</h2>
                <Link to="/portfolio" className="text-xs font-semibold flex items-center gap-0.5 hover:underline" style={{ color: GREEN }}>
                  Details <ChevronRight size={12} />
                </Link>
              </div>
              <PortfolioOverview portfolio={portfolio} learning={learning} />
            </div>
          )}

          {/* 9. Sector Heatmap */}
          <EnhancedSectorHeatmap />

          {/* 10. Market Heatmap (stock-level treemap) */}
          {market && <StockHeatmap prices={market.livePrices} />}

          {/* 11. Top Movers */}
          {market && (
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Top Movers</h2>
              <TopMovers prices={market.livePrices} />
            </div>
          )}

          {/* 12. Market News Feed */}
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Market News & Insights</h2>
            <MarketNewsFeed />
          </div>

          {/* 13. All Stocks Table */}
          {market && (
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>All Stocks</h2>
              <AllStocksTable prices={market.livePrices} />
            </div>
          )}

          {/* 14. Quick Action Cards */}
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Quick Actions</h2>
            <QuickActions />
          </div>

          {/* 10. Footer */}
          <div className="pt-4 flex items-center justify-between text-[11px]" style={{ borderTop: `1px solid ${BORDER}`, color: MUTED_LIGHT }}>
            <span>&copy; 2026 Abaci Investments &mdash; BSEC Licensed Merchant Bank</span>
            {market?.lastUpdated && (
              <span className="font-num">
                Last updated: {new Date(market.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
