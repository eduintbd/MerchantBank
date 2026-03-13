import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/useStocks';
import { useMarketData } from '@/hooks/useMarketData';
import { useLearningProgress } from '@/hooks/useLearning';
import { formatCurrency, formatPercent, formatDateTime, formatVolume, cn } from '@/lib/utils';
import type { LivePrice, MarketIndex } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  BarChart2,
  Wallet,
  ChevronRight,
  Activity,
  Zap,
  DollarSign,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ============================================
// STOCK TICKER — Animated marquee
// ============================================
function StockTicker({ prices }: { prices: LivePrice[] }) {
  const items = prices.slice(0, 30);
  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-b border-border bg-card-solid/80">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {[...items, ...items].map((p, i) => (
          <Link
            key={`${p.symbol}-${i}`}
            to={`/stock/${p.symbol}`}
            className="inline-flex items-center gap-1.5 mx-4 text-xs hover:opacity-80 transition-opacity"
          >
            <span className="font-semibold text-foreground">{p.symbol}</span>
            <span className="font-num text-foreground/60">{p.ltp.toFixed(2)}</span>
            <span className={cn(
              'font-num font-bold px-1.5 py-0.5 rounded text-[10px]',
              p.change_pct > 0 ? 'bg-success/15 text-success' : p.change_pct < 0 ? 'bg-danger/15 text-danger' : 'text-muted'
            )}>
              {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

// ============================================
// MARKET SUMMARY — 8 gradient stat cards
// ============================================
const SUMMARY_CARDS = [
  { key: 'dsex',    label: 'DSEX Index',       icon: TrendingUp,   gradient: 'from-[#0a2e2a] to-[#0d3d2e]', border: 'border-success/20', iconBg: 'bg-success/20', iconColor: 'text-success' },
  { key: 'dses',    label: 'DSES Index',       icon: TrendingUp,   gradient: 'from-[#0a2e2a] to-[#0d3d2e]', border: 'border-success/20', iconBg: 'bg-success/20', iconColor: 'text-success' },
  { key: 'ds30',    label: 'DS30 Index',       icon: TrendingUp,   gradient: 'from-[#0a2e2a] to-[#0d3d2e]', border: 'border-success/20', iconBg: 'bg-success/20', iconColor: 'text-success' },
  { key: 'trade',   label: 'Total Trade',      icon: Activity,     gradient: 'from-[#2e1a0a] to-[#3d2a0d]', border: 'border-warning/20', iconBg: 'bg-warning/20', iconColor: 'text-warning' },
  { key: 'volume',  label: 'Total Volume',     icon: BarChart2,    gradient: 'from-[#0a1a2e] to-[#0d2a3d]', border: 'border-info/20',    iconBg: 'bg-info/20',    iconColor: 'text-info' },
  { key: 'value',   label: 'Total Value (Bn)', icon: DollarSign,   gradient: 'from-[#1a0a2e] to-[#2a0d3d]', border: 'border-purple-400/20', iconBg: 'bg-purple-400/20', iconColor: 'text-purple-400' },
];

function MarketSummary({ indices, stats }: { indices: MarketIndex[]; stats: { totalVolume: number; totalValue: number; totalTrades: number; advancers: number; decliners: number } }) {
  const dsex = indices.find(i => i.index_name === 'DSEX');
  const dses = indices.find(i => i.index_name === 'DSES');
  const ds30 = indices.find(i => i.index_name === 'DS30');

  const fmtIdx = (idx?: MarketIndex) => idx ? idx.value.toFixed(2) : '—';
  const fmtChg = (idx?: MarketIndex) => idx ? `${idx.change >= 0 ? '+' : ''}${idx.change_pct.toFixed(2)}%` : undefined;
  const trend = (idx?: MarketIndex) => idx ? (idx.change >= 0 ? 'up' : 'down') : null;

  const values: Record<string, { value: string; sub?: string; trend?: 'up' | 'down' | null }> = {
    dsex:    { value: fmtIdx(dsex),         sub: fmtChg(dsex),         trend: trend(dsex) },
    dses:    { value: fmtIdx(dses),         sub: fmtChg(dses),         trend: trend(dses) },
    ds30:    { value: fmtIdx(ds30),         sub: fmtChg(ds30),         trend: trend(ds30) },
    trade:   { value: formatVolume(stats.totalTrades) },
    volume:  { value: formatVolume(stats.totalVolume) },
    value:   { value: `${(stats.totalValue / 1_000_000_000).toFixed(2)}B` },
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {SUMMARY_CARDS.map(card => {
        const Icon = card.icon;
        const val = values[card.key];
        return (
          <div key={card.key} className={cn('rounded-xl border bg-gradient-to-br p-3 sm:p-4', card.gradient, card.border)}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted font-medium leading-tight">{card.label}</p>
              <div className={cn('rounded-lg p-1.5 flex-shrink-0', card.iconBg)}>
                <Icon size={14} className={card.iconColor} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground font-num">{val.value}</p>
            {val.sub && (
              <p className={cn('mt-0.5 text-xs font-semibold font-num', val.trend === 'up' ? 'text-success' : val.trend === 'down' ? 'text-danger' : 'text-muted')}>
                {val.sub}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// STRENGTH METER — Donut + Sentiment bar
// ============================================
function StrengthMeter({ stats }: { stats: { advancers: number; decliners: number; unchanged: number; totalStocks: number } }) {
  const { advancers, decliners, unchanged, totalStocks } = stats;
  const bullPct = totalStocks > 0 ? Math.round((advancers / totalStocks) * 100) : 50;

  let sentiment = 'Neutral';
  let sentimentColor = '#8888aa';
  if (bullPct >= 65) { sentiment = 'Bull'; sentimentColor = '#0ecb81'; }
  else if (bullPct >= 55) { sentiment = 'Mild Bull'; sentimentColor = '#4fa3e0'; }
  else if (bullPct <= 35) { sentiment = 'Bear'; sentimentColor = '#f6465d'; }
  else if (bullPct <= 45) { sentiment = 'Mild Bear'; sentimentColor = '#ffa502'; }

  const donutData = [
    { name: 'Gainers', value: advancers, color: '#0ecb81' },
    { name: 'Losers', value: decliners, color: '#f6465d' },
    { name: 'Unchanged', value: unchanged, color: '#8888aa' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Market Strength donut */}
      <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-foreground mb-3">Market Strength</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" strokeWidth={0}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">{totalStocks}</span>
              <span className="text-[10px] text-muted">Stocks</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {[
              { label: 'Advancers', value: advancers, color: '#0ecb81' },
              { label: 'Decliners', value: decliners, color: '#f6465d' },
              { label: 'Unchanged', value: unchanged, color: '#8888aa' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-muted">{item.label}</span>
                </div>
                <span className="text-xs font-bold font-num" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Sentiment bar */}
      <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-foreground mb-3">Market Sentiment</h3>
        <div className="flex flex-col items-center gap-3">
          <p className="text-3xl font-black" style={{ color: sentimentColor }}>{sentiment}</p>
          <div className="w-full">
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #f6465d, #ffa502, #0ecb81)' }}>
              <div className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg transition-all duration-500"
                style={{ left: `calc(${bullPct}% - 2px)` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted">
              <span>Bear</span><span>Neutral</span><span>Bull</span>
            </div>
          </div>
          <p className="text-xs text-muted">
            Advancer Ratio: <span className="font-bold text-success font-num">{bullPct}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TOP MOVERS — Tabbed table
// ============================================
type MoverTab = 'gainer' | 'loser' | 'volume' | 'value' | 'trade';
const MOVER_TABS: { key: MoverTab; label: string; icon: React.ElementType }[] = [
  { key: 'gainer', label: 'Top Gainer', icon: TrendingUp },
  { key: 'loser',  label: 'Top Loser',  icon: TrendingDown },
  { key: 'volume', label: 'Top Volume', icon: BarChart2 },
  { key: 'value',  label: 'Top Value',  icon: DollarSign },
  { key: 'trade',  label: 'Top Trade',  icon: Activity },
];

function TopMoversSection({ prices }: { prices: LivePrice[] }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MoverTab>('gainer');

  const rows = useMemo(() => {
    const arr = [...prices];
    switch (tab) {
      case 'gainer': return arr.sort((a, b) => b.change_pct - a.change_pct).slice(0, 10);
      case 'loser':  return arr.sort((a, b) => a.change_pct - b.change_pct).slice(0, 10);
      case 'volume': return arr.sort((a, b) => b.volume - a.volume).slice(0, 10);
      case 'value':  return arr.sort((a, b) => b.value_traded - a.value_traded).slice(0, 10);
      case 'trade':  return arr.sort((a, b) => b.trades - a.trades).slice(0, 10);
    }
  }, [prices, tab]);

  return (
    <div className="rounded-xl border border-border bg-card-solid overflow-hidden shadow-[var(--shadow-card)]">
      <div className="p-4 pb-0">
        <h2 className="text-sm font-semibold text-foreground mb-3">Top Movers</h2>
        <div className="flex gap-0.5 border-b border-border overflow-x-auto scrollbar-hide">
          {MOVER_TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                  tab === t.key ? 'border-info text-info' : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted">SYMBOL</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted">LTP</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted">CHG %</th>
              {(tab === 'volume' || tab === 'trade') && (
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted">
                  {tab === 'volume' ? 'VOLUME' : 'TRADES'}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((s, i) => (
              <tr key={s.symbol} className="hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => navigate(`/stock/${s.symbol}`)}>
                <td className="px-4 py-2.5 text-xs text-muted">{i + 1}</td>
                <td className="px-4 py-2.5 font-bold text-foreground">{s.symbol}</td>
                <td className="px-4 py-2.5 text-right font-num font-semibold text-foreground">{s.ltp.toFixed(2)}</td>
                <td className={cn('px-4 py-2.5 text-right font-bold font-num', s.change_pct >= 0 ? 'text-success' : 'text-danger')}>
                  {s.change_pct >= 0 ? '+' : ''}{s.change_pct.toFixed(2)}%
                </td>
                {(tab === 'volume' || tab === 'trade') && (
                  <td className="px-4 py-2.5 text-right text-xs font-num text-muted">
                    {tab === 'volume' ? formatVolume(s.volume) : s.trades.toLocaleString()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// SECTOR PERFORMANCE — Horizontal bars
// ============================================
function SectorPerformance({ prices }: { prices: LivePrice[] }) {
  const sectors = useMemo(() => {
    // We need to join with stocks table to get sectors - use LivePrice symbol grouping for now
    // This is a simplified version; actual sector data comes from the stocks table
    return [];
  }, [prices]);

  // Since LivePrice doesn't have sector info, we'll skip this for now
  // The SectorHeatmap component already handles this with its own hook
  if (sectors.length === 0) return null;
  return null;
}

// ============================================
// ALL STOCKS TABLE — Sortable + Filterable + Paginated
// ============================================
type SortKey = 'symbol' | 'ltp' | 'change_pct' | 'volume' | 'value_traded';
const PAGE_SIZE = 50;

function AllStocksTable({ prices }: { prices: LivePrice[] }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = prices.filter(s =>
    !search || s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    if (sortKey === 'symbol') {
      return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
    }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const SortTh = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => handleSort(k)}
    >
      {label}{sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );

  return (
    <div className="rounded-xl border border-border bg-card-solid overflow-hidden shadow-[var(--shadow-card)]">
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Filter stocks..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-white/[0.03] text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02]">
            <tr>
              <SortTh label="Symbol" k="symbol" />
              <SortTh label="LTP" k="ltp" />
              <SortTh label="Change %" k="change_pct" />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Change</th>
              <SortTh label="Volume" k="volume" />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">High</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Low</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paged.map(s => (
              <tr
                key={s.symbol}
                className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                onClick={() => navigate(`/stock/${s.symbol}`)}
              >
                <td className="px-3 py-2 font-bold text-info">{s.symbol}</td>
                <td className="px-3 py-2 font-num font-semibold text-foreground">{s.ltp.toFixed(2)}</td>
                <td className={cn('px-3 py-2 font-semibold font-num', s.change_pct >= 0 ? 'text-success' : 'text-danger')}>
                  {s.change_pct >= 0 ? '+' : ''}{s.change_pct.toFixed(2)}%
                </td>
                <td className={cn('px-3 py-2 font-num text-xs', s.change >= 0 ? 'text-success' : 'text-danger')}>
                  {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-xs font-num text-muted">{formatVolume(s.volume)}</td>
                <td className="px-3 py-2 text-xs font-num text-muted hidden lg:table-cell">{s.high.toFixed(2)}</td>
                <td className="px-3 py-2 text-xs font-num text-muted hidden lg:table-cell">{s.low.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="text-xs text-muted">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded px-2 py-1 text-xs border border-border hover:bg-white/[0.04] disabled:opacity-40 transition-colors"
            >Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded px-2 py-1 text-xs border border-border hover:bg-white/[0.04] disabled:opacity-40 transition-colors"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export function Dashboard() {
  const { user } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { data: market, isLoading: marketLoading } = useMarketData();
  const { data: learning } = useLearningProgress();

  const lastUpdate = market?.lastUpdated ? new Date(market.lastUpdated) : null;
  const timeDiffMin = lastUpdate ? (Date.now() - lastUpdate.getTime()) / 60000 : Infinity;
  const isMarketOpen = timeDiffMin < 10;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Stock Ticker */}
      {market && <StockTicker prices={market.livePrices} />}

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-2 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div className="space-y-4 sm:space-y-6">

          {/* ========== HEADER ========== */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Welcome, {user?.full_name?.split(' ')[0] || 'Investor'}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <p className="text-muted text-sm">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border',
                  isMarketOpen
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-danger/30 bg-danger/10 text-danger'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', isMarketOpen ? 'bg-success animate-pulse' : 'bg-danger')} />
                  DSE {isMarketOpen ? 'OPEN' : 'CLOSED'}
                </span>
                {market?.lastUpdated && (
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Activity size={10} className={isMarketOpen ? 'text-success' : 'text-muted'} />
                    {formatDateTime(market.lastUpdated)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/trading" className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary font-medium hover:bg-primary/20 transition-colors">
                <TrendingUp size={14} /> Trade
              </Link>
            </div>
          </div>

          {/* ========== MARKET SUMMARY — 8 Cards ========== */}
          {marketLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton rounded-xl h-[90px]" />)}
            </div>
          ) : market && (
            <MarketSummary indices={market.indices} stats={market.stats} />
          )}

          {/* ========== STRENGTH METER ========== */}
          {market && (
            <StrengthMeter stats={market.stats} />
          )}

          {/* ========== PORTFOLIO OVERVIEW ========== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm sm:text-lg font-semibold text-foreground">Portfolio Overview</h2>
              <Link to="/portfolio" className="text-xs text-info hover:text-info/80 flex items-center gap-0.5 font-medium">
                Details <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Portfolio Value', value: formatCurrency(portfolio?.current_value || 0), icon: Briefcase, color: 'text-info', bg: 'bg-info/20', gradient: 'from-[#0a1a2e] to-[#0d2a3d]', border: 'border-info/20', sub: portfolio ? `${portfolio.total_profit_loss_percent >= 0 ? '+' : ''}${portfolio.total_profit_loss_percent.toFixed(2)}%` : undefined, subColor: portfolio && portfolio.total_profit_loss_percent >= 0 ? 'text-success' : 'text-danger' },
                { label: 'Invested', value: formatCurrency(portfolio?.total_invested || 0), icon: Wallet, color: 'text-success', bg: 'bg-success/20', gradient: 'from-[#0a2e1a] to-[#0d3d28]', border: 'border-success/20', sub: `${portfolio?.total_stocks || 0} stocks` },
                { label: 'Day P&L', value: formatCurrency(portfolio?.total_profit_loss || 0), icon: BarChart2, color: portfolio && portfolio.total_profit_loss >= 0 ? 'text-success' : 'text-danger', bg: portfolio && portfolio.total_profit_loss >= 0 ? 'bg-success/20' : 'bg-danger/20', gradient: portfolio && portfolio.total_profit_loss >= 0 ? 'from-[#0a2e1a] to-[#0d3d28]' : 'from-[#2e0a0a] to-[#3d0d1a]', border: portfolio && portfolio.total_profit_loss >= 0 ? 'border-success/20' : 'border-danger/20' },
                { label: 'Learning', value: `${learning?.progressPercent || 0}%`, icon: GraduationCap, color: 'text-warning', bg: 'bg-warning/20', gradient: 'from-[#2e1a0a] to-[#3d2a0d]', border: 'border-warning/20', sub: learning?.isQualified ? 'Qualified' : 'In progress' },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={cn('rounded-xl border bg-gradient-to-br p-3 sm:p-4', card.gradient, card.border)}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs text-muted font-medium leading-tight">{card.label}</p>
                      <div className={cn('rounded-lg p-1.5 flex-shrink-0', card.bg)}>
                        <Icon size={14} className={card.color} />
                      </div>
                    </div>
                    <p className={cn('text-lg sm:text-xl font-bold font-num', card.color)}>{card.value}</p>
                    {card.sub && (
                      <p className={cn('mt-0.5 text-xs font-semibold font-num', card.subColor || 'text-muted')}>{card.sub}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========== HOLDINGS PREVIEW ========== */}
          {portfolio && portfolio.items.length > 0 && (
            <div className="rounded-xl border border-border bg-card-solid overflow-hidden shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Zap size={14} className="text-warning" /> Holdings
                </h2>
                <Link to="/portfolio" className="text-xs text-info hover:text-info/80 flex items-center gap-0.5 font-medium">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02]">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Stock</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide">Qty</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Avg</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide">LTP</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide">P&L</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide">P&L%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {portfolio.items.slice(0, 8).map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-2.5">
                          <Link to={`/stock/${item.stock_symbol}`} className="font-bold text-info hover:underline">{item.stock_symbol}</Link>
                        </td>
                        <td className="px-3 py-2.5 text-right font-num text-muted">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-num text-muted hidden sm:table-cell">{item.avg_buy_price.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-num font-semibold text-foreground">{item.current_price.toFixed(2)}</td>
                        <td className={cn('px-3 py-2.5 text-right font-num font-semibold', item.profit_loss >= 0 ? 'text-success' : 'text-danger')}>
                          {formatCurrency(item.profit_loss)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn(
                            'inline-block min-w-[50px] px-2 py-0.5 rounded text-xs font-bold font-num text-center',
                            item.profit_loss_percent >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                          )}>
                            {formatPercent(item.profit_loss_percent)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== TOP MOVERS ========== */}
          {market && (
            <div>
              <h2 className="mb-2 sm:mb-3 text-sm sm:text-lg font-semibold text-foreground">Top Movers</h2>
              <TopMoversSection prices={market.livePrices} />
            </div>
          )}

          {/* ========== ALL STOCKS TABLE ========== */}
          {market && (
            <div>
              <h2 className="mb-2 sm:mb-3 text-sm sm:text-lg font-semibold text-foreground">All Stocks</h2>
              <AllStocksTable prices={market.livePrices} />
            </div>
          )}

          {/* ========== ACTION ALERTS ========== */}
          {(user?.kyc_status !== 'verified' || (learning && !learning.isQualified)) && (
            <div className="space-y-2.5">
              <h2 className="text-sm sm:text-lg font-semibold text-foreground">Action Required</h2>
              {user?.kyc_status !== 'verified' && (
                <div className="rounded-xl bg-card-solid border border-border p-4 flex items-center gap-3 border-l-4 border-l-warning shadow-[var(--shadow-card)]">
                  <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Complete KYC Verification</p>
                    <p className="text-xs text-muted mt-0.5">Submit documents to unlock trading</p>
                  </div>
                  <Link to="/kyc" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.04] transition-colors">
                    Go <ChevronRight size={12} className="inline" />
                  </Link>
                </div>
              )}
              {learning && !learning.isQualified && (
                <div className="rounded-xl bg-card-solid border border-border p-4 flex items-center gap-3 border-l-4 border-l-info shadow-[var(--shadow-card)]">
                  <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
                    <GraduationCap size={18} className="text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Complete Learning</p>
                    <p className="text-xs text-muted mt-0.5">{learning.completedLessons}/{learning.totalLessons} lessons</p>
                    <div className="w-full bg-border/40 rounded-full h-1 mt-2">
                      <div className="bg-info h-1 rounded-full transition-all" style={{ width: `${learning.progressPercent}%` }} />
                    </div>
                  </div>
                  <Link to="/learning" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.04] transition-colors">
                    Go <ChevronRight size={12} className="inline" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ========== QUICK ACTIONS ========== */}
          <div>
            <h2 className="text-sm sm:text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { to: '/trading', icon: TrendingUp, label: 'Trade', color: 'text-success', bg: 'bg-success/10', gradient: 'from-[#0a2e1a] to-[#0d3d28]', border: 'border-success/20' },
                { to: '/portfolio', icon: BarChart2, label: 'Portfolio', color: 'text-info', bg: 'bg-info/10', gradient: 'from-[#0a1a2e] to-[#0d2a3d]', border: 'border-info/20' },
                { to: '/ipo', icon: Zap, label: 'IPO', color: 'text-warning', bg: 'bg-warning/10', gradient: 'from-[#2e1a0a] to-[#3d2a0d]', border: 'border-warning/20' },
              ].map(item => (
                <Link key={item.to} to={item.to}>
                  <div className={cn('rounded-xl border bg-gradient-to-br p-5 sm:p-6 text-center group hover:scale-[1.02] transition-transform', item.gradient, item.border)}>
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110', item.bg)}>
                      <item.icon size={22} className={item.color} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ========== FOOTER ========== */}
          <footer className="border-t border-border pt-4">
            <div className="flex flex-col items-center justify-between gap-2 text-center text-[10px] sm:text-xs text-muted md:flex-row md:text-left">
              <p>&copy; {new Date().getFullYear()} HeroStock.AI</p>
              {market?.lastUpdated && (
                <p>Updated: <span className="font-num">{new Date(market.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
              )}
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
