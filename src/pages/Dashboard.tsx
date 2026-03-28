import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/useStocks';
import { useMarketData } from '@/hooks/useMarketData';
import { useLearningProgress } from '@/hooks/useLearning';
import { formatCurrency, formatPercent, formatDateTime, formatVolume, cn } from '@/lib/utils';
import type { LivePrice, MarketIndex } from '@/types';
import {
  TrendingUp, TrendingDown, Briefcase, GraduationCap, ShieldCheck,
  BarChart2, Wallet, ChevronRight, Activity, Zap, DollarSign,
  Search, Eye, Star, Newspaper, ArrowUpRight, ArrowDownRight,
  Clock, Globe, Flame, Volume2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ─── STOCK TICKER ────────────────────────────────────────
function StockTicker({ prices }: { prices: LivePrice[] }) {
  const items = prices.slice(0, 30);
  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-[#1b2a4a] text-white">
      <div className="flex animate-marquee whitespace-nowrap py-1.5">
        {[...items, ...items].map((p, i) => (
          <Link
            key={`${p.symbol}-${i}`}
            to={`/stock/${p.symbol}`}
            className="inline-flex items-center gap-1.5 mx-4 text-[11px] hover:opacity-80 transition-opacity"
          >
            <span className="font-semibold text-white/90">{p.symbol}</span>
            <span className="font-num text-white/50">{p.ltp.toFixed(2)}</span>
            <span className={cn(
              'font-num font-bold',
              p.change_pct > 0 ? 'text-emerald-400' : p.change_pct < 0 ? 'text-red-400' : 'text-white/40'
            )}>
              {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#1b2a4a] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#1b2a4a] to-transparent pointer-events-none" />
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

// ─── INDEX CARDS ─────────────────────────────────────────
const INDEX_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  DSEX: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  DSES: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  DS30: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
};

function IndexCards({ indices }: { indices: MarketIndex[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {indices.map(idx => {
        const cfg = INDEX_CONFIG[idx.index_name] || INDEX_CONFIG.DSEX;
        const isUp = idx.change >= 0;
        return (
          <div key={idx.index_name} className={cn('rounded-xl border-2 p-3 sm:p-5 transition-shadow hover:shadow-md min-w-0', cfg.border, cfg.bg)}>
            <div className="flex items-center justify-between mb-1 sm:mb-2 gap-1">
              <span className={cn('text-[10px] sm:text-xs font-bold uppercase tracking-wide', cfg.color)}>{idx.index_name}</span>
              <div className={cn(
                'flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold shrink-0',
                isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              )}>
                {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {isUp ? '+' : ''}{idx.change_pct.toFixed(2)}%
              </div>
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold font-num text-gray-900 tracking-tight truncate">
              {idx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className={cn('text-[10px] sm:text-xs font-semibold font-num mt-1', isUp ? 'text-emerald-600' : 'text-red-600')}>
              {isUp ? '+' : ''}{idx.change.toFixed(2)} pts
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── MARKET STATS BAR ────────────────────────────────────
function MarketStatsBar({ stats }: { stats: { totalVolume: number; totalValue: number; totalTrades: number; advancers: number; decliners: number; unchanged: number; totalStocks: number } }) {
  const items = [
    { label: 'Volume', value: formatVolume(stats.totalVolume), icon: Volume2, color: 'text-blue-600' },
    { label: 'Trades', value: formatVolume(stats.totalTrades), icon: Activity, color: 'text-amber-600' },
    { label: 'Value', value: `${(stats.totalValue / 1e9).toFixed(2)}B`, icon: DollarSign, color: 'text-violet-600' },
    { label: 'Advancers', value: String(stats.advancers), icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Decliners', value: String(stats.decliners), icon: TrendingDown, color: 'text-red-600' },
    { label: 'Unchanged', value: String(stats.unchanged), icon: Activity, color: 'text-gray-500' },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
      {items.map(s => (
        <div key={s.label} className="rounded-lg border border-gray-100 bg-white p-2 sm:p-3 text-center shadow-sm min-w-0">
          <s.icon size={14} className={cn('mx-auto mb-0.5 sm:mb-1', s.color)} />
          <p className="text-sm sm:text-lg font-bold font-num text-gray-900 truncate">{s.value}</p>
          <p className="text-[8px] sm:text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── STRENGTH + SENTIMENT ────────────────────────────────
function MarketStrengthPanel({ stats }: { stats: { advancers: number; decliners: number; unchanged: number; totalStocks: number } }) {
  const { advancers, decliners, unchanged, totalStocks } = stats;
  const bullPct = totalStocks > 0 ? Math.round((advancers / totalStocks) * 100) : 50;

  let sentiment = 'Neutral';
  let sentimentColor = 'text-gray-600';
  let sentimentBg = 'bg-gray-50';
  if (bullPct >= 65) { sentiment = 'Bullish'; sentimentColor = 'text-emerald-700'; sentimentBg = 'bg-emerald-50'; }
  else if (bullPct >= 55) { sentiment = 'Mild Bull'; sentimentColor = 'text-blue-700'; sentimentBg = 'bg-blue-50'; }
  else if (bullPct <= 35) { sentiment = 'Bearish'; sentimentColor = 'text-red-700'; sentimentBg = 'bg-red-50'; }
  else if (bullPct <= 45) { sentiment = 'Mild Bear'; sentimentColor = 'text-amber-700'; sentimentBg = 'bg-amber-50'; }

  const donutData = [
    { name: 'Gainers', value: advancers, color: '#059669' },
    { name: 'Losers', value: decliners, color: '#dc2626' },
    { name: 'Unchanged', value: unchanged, color: '#d1d5db' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Market Strength */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
          <BarChart2 size={14} className="text-blue-600" /> Market Breadth
        </h3>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={2} stroke="#fff">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{totalStocks}</span>
              <span className="text-[9px] text-gray-500 font-medium">Stocks</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {donutData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs font-medium text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold font-num text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
          <Eye size={14} className="text-violet-600" /> Market Sentiment
        </h3>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className={cn('px-4 py-1.5 rounded-full text-lg font-black', sentimentColor, sentimentBg)}>
            {sentiment}
          </div>
          <div className="w-full">
            <div className="relative h-2.5 rounded-full overflow-hidden bg-gray-100">
              <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #059669)' }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-gray-900 transition-all duration-500"
                style={{ left: `calc(${bullPct}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-medium text-gray-500">
              <span>Bear</span><span>Neutral</span><span>Bull</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Advancer Ratio: <span className="font-bold text-emerald-600 font-num">{bullPct}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── PORTFOLIO OVERVIEW ──────────────────────────────────
function PortfolioOverview({ portfolio, learning }: { portfolio: any; learning: any }) {
  const cards = [
    { label: 'Portfolio Value', value: formatCurrency(portfolio?.current_value || 0), icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', sub: portfolio ? `${portfolio.total_profit_loss_percent >= 0 ? '+' : ''}${portfolio.total_profit_loss_percent.toFixed(2)}%` : undefined, subUp: portfolio?.total_profit_loss_percent >= 0 },
    { label: 'Invested', value: formatCurrency(portfolio?.total_invested || 0), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', sub: `${portfolio?.total_stocks || 0} stocks` },
    { label: 'Day P&L', value: formatCurrency(portfolio?.total_profit_loss || 0), icon: BarChart2, color: portfolio?.total_profit_loss >= 0 ? 'text-emerald-600' : 'text-red-600', bg: portfolio?.total_profit_loss >= 0 ? 'bg-emerald-50' : 'bg-red-50', border: portfolio?.total_profit_loss >= 0 ? 'border-emerald-200' : 'border-red-200' },
    { label: 'Learning', value: `${learning?.progressPercent || 0}%`, icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', sub: learning?.isQualified ? 'Qualified' : 'In progress' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {cards.map(card => (
        <div key={card.label} className={cn('rounded-xl border-2 p-3 sm:p-4 min-w-0 overflow-hidden', card.border, card.bg)}>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
            <p className="text-[9px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wide truncate">{card.label}</p>
            <card.icon size={14} className={cn(card.color, 'shrink-0')} />
          </div>
          <p className={cn('text-base sm:text-xl font-bold font-num truncate', card.color)}>{card.value}</p>
          {card.sub && (
            <p className={cn('mt-0.5 text-[10px] sm:text-xs font-semibold font-num truncate', card.subUp === true ? 'text-emerald-600' : card.subUp === false ? 'text-red-600' : 'text-gray-500')}>
              {card.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── TOP MOVERS ──────────────────────────────────────────
type MoverTab = 'gainer' | 'loser' | 'volume' | 'value' | 'trade';
const MOVER_TABS: { key: MoverTab; label: string; icon: React.ElementType }[] = [
  { key: 'gainer', label: 'Gainers', icon: TrendingUp },
  { key: 'loser', label: 'Losers', icon: TrendingDown },
  { key: 'volume', label: 'Volume', icon: Volume2 },
  { key: 'value', label: 'Value', icon: DollarSign },
  { key: 'trade', label: 'Trades', icon: Flame },
];

function TopMoversSection({ prices }: { prices: LivePrice[] }) {
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
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-1 px-4 pt-4 pb-0 overflow-x-auto scrollbar-hide">
        {MOVER_TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
                isActive
                  ? t.key === 'gainer' ? 'bg-emerald-100 text-emerald-700'
                    : t.key === 'loser' ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">#</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Symbol</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">LTP</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change %</th>
              {(tab === 'volume' || tab === 'trade') && (
                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {tab === 'volume' ? 'Volume' : 'Trades'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const isUp = s.change_pct >= 0;
              return (
                <tr
                  key={s.symbol}
                  className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/stock/${s.symbol}`)}
                >
                  <td className="px-4 py-2.5 text-xs text-gray-400 font-num">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-gray-900">{s.symbol}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-num font-semibold text-gray-900">{s.ltp.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn(
                      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold font-num',
                      isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {isUp ? '+' : ''}{s.change_pct.toFixed(2)}%
                    </span>
                  </td>
                  {(tab === 'volume' || tab === 'trade') && (
                    <td className="px-4 py-2.5 text-right text-xs font-num text-gray-500">
                      {tab === 'volume' ? formatVolume(s.volume) : s.trades.toLocaleString()}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MOST ACTIVE SNAPSHOT ────────────────────────────────
function MostActiveSnapshot({ prices }: { prices: LivePrice[] }) {
  const navigate = useNavigate();
  const active = useMemo(() => [...prices].sort((a, b) => b.volume - a.volume).slice(0, 5), [prices]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Flame size={14} className="text-orange-500" /> Most Active
      </h3>
      <div className="space-y-2">
        {active.map(s => {
          const isUp = s.change_pct >= 0;
          return (
            <div
              key={s.symbol}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/stock/${s.symbol}`)}
            >
              <div>
                <span className="text-sm font-bold text-gray-900">{s.symbol}</span>
                <span className="text-[10px] text-gray-400 ml-2 font-num">{formatVolume(s.volume)} vol</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-num text-gray-900">{s.ltp.toFixed(2)}</span>
                <span className={cn('ml-2 text-xs font-bold font-num', isUp ? 'text-emerald-600' : 'text-red-600')}>
                  {isUp ? '+' : ''}{s.change_pct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 52W HIGH/LOW ────────────────────────────────────────
function WeekHighLow({ prices }: { prices: LivePrice[] }) {
  const near52High = useMemo(() =>
    [...prices].filter(p => p.high > 0 && p.ltp >= p.high * 0.98).sort((a, b) => b.change_pct - a.change_pct).slice(0, 5),
    [prices]
  );
  const near52Low = useMemo(() =>
    [...prices].filter(p => p.low > 0 && p.ltp <= p.low * 1.02).sort((a, b) => a.change_pct - b.change_pct).slice(0, 5),
    [prices]
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-bold text-emerald-700 mb-2 sm:mb-3 flex items-center gap-2">
          <ArrowUpRight size={14} /> Near Day High
        </h3>
        {near52High.length === 0 ? (
          <p className="text-xs text-gray-500">No stocks near day high</p>
        ) : (
          <div className="space-y-1.5">
            {near52High.map(s => (
              <div key={s.symbol} className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-gray-900">{s.symbol}</span>
                <span className="font-num font-semibold text-emerald-700">{s.ltp.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-bold text-red-700 mb-2 sm:mb-3 flex items-center gap-2">
          <ArrowDownRight size={14} /> Near Day Low
        </h3>
        {near52Low.length === 0 ? (
          <p className="text-xs text-gray-500">No stocks near day low</p>
        ) : (
          <div className="space-y-1.5">
            {near52Low.map(s => (
              <div key={s.symbol} className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-gray-900">{s.symbol}</span>
                <span className="font-num font-semibold text-red-700">{s.ltp.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ALL STOCKS TABLE ────────────────────────────────────
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

  const SortTh = ({ label, k, align }: { label: string; k: SortKey; align?: string }) => (
    <th
      className={cn('px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors', align || 'text-left')}
      onClick={() => handleSort(k)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {sortKey === k && <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all"
          />
        </div>
        <span className="text-xs font-medium text-gray-400">{sorted.length} stocks</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              <SortTh label="Symbol" k="symbol" />
              <SortTh label="LTP" k="ltp" align="text-right" />
              <SortTh label="Change %" k="change_pct" align="text-right" />
              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change</th>
              <SortTh label="Volume" k="volume" align="text-right" />
              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">High</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Low</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(s => {
              const isUp = s.change_pct >= 0;
              return (
                <tr
                  key={s.symbol}
                  className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/stock/${s.symbol}`)}
                >
                  <td className="px-3 py-2.5 font-bold text-blue-600">{s.symbol}</td>
                  <td className="px-3 py-2.5 text-right font-num font-semibold text-gray-900">{s.ltp.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={cn(
                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold font-num',
                      isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {isUp ? '+' : ''}{s.change_pct.toFixed(2)}%
                    </span>
                  </td>
                  <td className={cn('px-3 py-2.5 text-right font-num text-xs', isUp ? 'text-emerald-600' : 'text-red-600')}>
                    {isUp ? '+' : ''}{s.change.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-num text-gray-500">{formatVolume(s.volume)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-num text-gray-500 hidden lg:table-cell">{s.high.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-num text-gray-500 hidden lg:table-cell">{s.low.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
          <span className="text-xs text-gray-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg px-3 py-1 text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg px-3 py-1 text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export function Dashboard() {
  const { user } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { data: market, isLoading: marketLoading } = useMarketData();
  const { data: learning } = useLearningProgress();

  const lastUpdate = market?.lastUpdated ? new Date(market.lastUpdated) : null;
  const timeDiffMin = lastUpdate ? (Date.now() - lastUpdate.getTime()) / 60000 : Infinity;
  const isMarketOpen = timeDiffMin < 10;

  return (
    <div className="animate-fade-in">
      {/* Stock Ticker — edge-to-edge */}
      {market && <StockTicker prices={market.livePrices} />}

      {/* Centered content container */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="space-y-5">

          {/* ── HEADER ── */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 truncate">
                Welcome, {user?.full_name?.split(' ')[0] || 'Investor'}
              </h1>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 flex-wrap">
                <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1">
                  <Clock size={12} />
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full',
                  isMarketOpen
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                  DSE {isMarketOpen ? 'OPEN' : 'CLOSED'}
                </span>
                {market?.lastUpdated && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Activity size={10} />
                    {formatDateTime(market.lastUpdated)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Link to="/trading" className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                <TrendingUp size={14} /> Trade
              </Link>
            </div>
          </div>

          {/* ── INDEX CARDS ── */}
          {marketLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton rounded-xl h-[100px]" />)}
            </div>
          ) : market && (
            <IndexCards indices={market.indices} />
          )}

          {/* ── MARKET STATS BAR ── */}
          {market && <MarketStatsBar stats={market.stats} />}

          {/* ── STRENGTH + SENTIMENT ── */}
          {market && <MarketStrengthPanel stats={market.stats} />}

          {/* ── PORTFOLIO OVERVIEW ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600" /> Portfolio Overview
              </h2>
              <Link to="/portfolio" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold">
                Details <ChevronRight size={12} />
              </Link>
            </div>
            <PortfolioOverview portfolio={portfolio} learning={learning} />
          </div>

          {/* ── HOLDINGS PREVIEW ── */}
          {portfolio && portfolio.items.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Star size={14} className="text-amber-500" /> Holdings
                </h2>
                <Link to="/portfolio" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Avg</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">LTP</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">P&L</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">P&L%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.items.slice(0, 8).map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link to={`/stock/${item.stock_symbol}`} className="font-bold text-blue-600 hover:underline">{item.stock_symbol}</Link>
                        </td>
                        <td className="px-3 py-2.5 text-right font-num text-gray-500">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-num text-gray-500 hidden sm:table-cell">{item.avg_buy_price.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-num font-semibold text-gray-900">{item.current_price.toFixed(2)}</td>
                        <td className={cn('px-3 py-2.5 text-right font-num font-semibold', item.profit_loss >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {formatCurrency(item.profit_loss)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn(
                            'inline-block min-w-[50px] px-2 py-0.5 rounded text-xs font-bold font-num text-center',
                            item.profit_loss_percent >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
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

          {/* ── TOP MOVERS ── */}
          {market && (
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> Top Movers
              </h2>
              <TopMoversSection prices={market.livePrices} />
            </div>
          )}

          {/* ── MOST ACTIVE + DAY HIGH/LOW ── */}
          {market && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <MostActiveSnapshot prices={market.livePrices} />
              <WeekHighLow prices={market.livePrices} />
            </div>
          )}

          {/* ── ALL STOCKS TABLE ── */}
          {market && (
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Globe size={16} className="text-blue-600" /> All Stocks
              </h2>
              <AllStocksTable prices={market.livePrices} />
            </div>
          )}

          {/* ── ACTION ALERTS ── */}
          {(user?.kyc_status !== 'verified' || (learning && !learning.isQualified)) && (
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Action Required</h2>
              {user?.kyc_status !== 'verified' && (
                <div className="rounded-xl bg-white border border-amber-200 p-4 flex items-center gap-3 border-l-4 border-l-amber-500 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Complete KYC Verification</p>
                    <p className="text-xs text-gray-500 mt-0.5">Submit documents to unlock live trading</p>
                  </div>
                  <Link to="/kyc" className="rounded-lg bg-amber-100 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition-colors">
                    Go <ChevronRight size={12} className="inline" />
                  </Link>
                </div>
              )}
              {learning && !learning.isQualified && (
                <div className="rounded-xl bg-white border border-blue-200 p-4 flex items-center gap-3 border-l-4 border-l-blue-500 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <GraduationCap size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Complete Learning</p>
                    <p className="text-xs text-gray-500 mt-0.5">{learning.completedLessons}/{learning.totalLessons} lessons</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${learning.progressPercent}%` }} />
                    </div>
                  </div>
                  <Link to="/learning" className="rounded-lg bg-blue-100 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors">
                    Go <ChevronRight size={12} className="inline" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── QUICK ACTIONS ── */}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              {[
                { to: '/trading', icon: TrendingUp, label: 'Trade', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { to: '/portfolio', icon: Briefcase, label: 'Portfolio', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { to: '/ipo', icon: Zap, label: 'IPO', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { to: '/market', icon: BarChart2, label: 'Market', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
                { to: '/learning', icon: GraduationCap, label: 'Learn', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
                { to: '/social', icon: Newspaper, label: 'Social', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
              ].map(item => (
                <Link key={item.to} to={item.to}>
                  <div className={cn('rounded-xl border-2 p-4 text-center group hover:shadow-md transition-all', item.border, item.bg)}>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110', `${item.bg}`)}>
                      <item.icon size={20} className={item.color} />
                    </div>
                    <p className="text-xs font-bold text-gray-700">{item.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <footer className="border-t border-gray-200 pt-4">
            <div className="flex flex-col items-center justify-between gap-2 text-center text-[10px] sm:text-xs text-gray-400 md:flex-row md:text-left">
              <p>&copy; {new Date().getFullYear()} HeroStock.AI — Regulated by BSEC</p>
              {market?.lastUpdated && (
                <p>Last updated: <span className="font-num">{new Date(market.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
