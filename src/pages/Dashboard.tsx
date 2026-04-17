import { useState, useMemo, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { ExchangeToggle, type ExchangeFilter } from '@/components/ui/ExchangeToggle';
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

/* ─── Stock Ticker ─── */
function StockTicker({ prices }: { prices: LivePrice[] }) {
  const items = prices.slice(0, 30);
  if (!items.length) return null;
  return (
    <div className="relative overflow-hidden bg-[#232526] text-white border-b border-[#333]">
      <div className="flex animate-marquee whitespace-nowrap" style={{ padding: '6px 0' }}>
        {[...items, ...items].map((p, i) => (
          <Link key={`${p.symbol}-${i}`} to={`/stock/${p.symbol}`}
            className="inline-flex items-center gap-1 mx-3 text-xs hover:opacity-80">
            <span className="font-semibold">{p.symbol}</span>
            <span className="opacity-50 font-num">{p.ltp.toFixed(2)}</span>
            <span className={cn('font-num font-semibold', p.change_pct > 0 ? 'text-[#26a69a]' : p.change_pct < 0 ? 'text-[#ef5350]' : 'opacity-40')}>
              {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#232526] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#232526] to-transparent pointer-events-none" />
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

/* ─── DSEX Hero Landing (investing.com style) ─── */
function DSEXHero({ indices, stats, isMarketOpen, lastUpdated }: {
  indices: MarketIndex[];
  stats: { totalVolume: number; totalValue: number; totalTrades: number; advancers: number; decliners: number; unchanged: number; totalStocks: number };
  isMarketOpen: boolean;
  lastUpdated?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const selected = indices[activeIdx] || indices[0];
  const up = selected.change >= 0;

  return (
    <div className="border border-[#e5e5e5] rounded overflow-hidden">
      {/* Index Tabs */}
      <div className="flex border-b border-[#e5e5e5] bg-[#f9f9f9]">
        {indices.map((idx, i) => {
          const isActive = i === activeIdx;
          const idxUp = idx.change >= 0;
          return (
            <button key={idx.index_name} onClick={() => setActiveIdx(i)}
              className={cn('flex-1 px-2 sm:px-4 py-2 sm:py-3 text-center border-b-2 transition-colors min-w-0',
                isActive ? 'border-[#0b8a00] bg-white' : 'border-transparent hover:bg-[#f0f0f0]'
              )}>
              <div className="text-[10px] sm:text-xs font-semibold text-[#888] truncate">{idx.index_name}</div>
              <div className="text-sm sm:text-base font-bold font-num text-[#333] mt-0.5 truncate">
                {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={cn('text-[10px] sm:text-xs font-semibold font-num mt-0.5 truncate', idxUp ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                {idxUp ? '+' : ''}{idx.change.toFixed(2)} ({idxUp ? '+' : ''}{idx.change_pct.toFixed(2)}%)
              </div>
            </button>
          );
        })}
      </div>

      {/* Hero Section */}
      <div className="p-3 sm:p-5 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Left — Main Index Display */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <h2 className="text-base sm:text-lg font-bold text-[#333]">{selected.index_name} Index</h2>
              <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded',
                isMarketOpen ? 'bg-[#e8f5e9] text-[#0b8a00]' : 'bg-[#ffebee] text-[#d32f2f]'
              )}>
                {isMarketOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-4xl font-bold font-num text-[#333]">
                {selected.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={cn('text-base sm:text-xl font-bold font-num', up ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                {up ? '+' : ''}{selected.change.toFixed(2)}
              </span>
              <span className={cn('text-xs sm:text-base font-bold font-num px-2 py-0.5 rounded text-white', up ? 'bg-[#0b8a00]' : 'bg-[#d32f2f]')}>
                {up ? '+' : ''}{selected.change_pct.toFixed(2)}%
              </span>
            </div>
            {lastUpdated && (
              <div className="text-xs text-[#aaa] mt-2">
                As of {formatDateTime(lastUpdated)} · DSE & CSE
              </div>
            )}
          </div>

          {/* Right — Key Stats */}
          <div className="grid grid-cols-2 gap-x-3 sm:gap-x-8 gap-y-2 text-left sm:text-right">
            <div>
              <div className="text-[11px] text-[#aaa]">Volume</div>
              <div className="text-sm font-semibold font-num text-[#333]">{formatVolume(stats.totalVolume)}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#aaa]">Trades</div>
              <div className="text-sm font-semibold font-num text-[#333]">{formatVolume(stats.totalTrades)}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#aaa]">Value</div>
              <div className="text-sm font-semibold font-num text-[#333]">{(stats.totalValue / 1e9).toFixed(2)}B</div>
            </div>
            <div>
              <div className="text-[11px] text-[#aaa]">Adv / Dec</div>
              <div className="text-sm font-semibold font-num">
                <span className="text-[#0b8a00]">{stats.advancers}</span>
                <span className="text-[#aaa] mx-1">/</span>
                <span className="text-[#d32f2f]">{stats.decliners}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats Row */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 sm:hidden">
          <span className="text-xs text-[#888]">Vol: <strong className="font-num text-[#333]">{formatVolume(stats.totalVolume)}</strong></span>
          <span className="text-xs text-[#888]">Trades: <strong className="font-num text-[#333]">{formatVolume(stats.totalTrades)}</strong></span>
          <span className="text-xs">
            <span className="text-[#0b8a00] font-semibold font-num">{stats.advancers}</span>
            <span className="text-[#aaa]"> / </span>
            <span className="text-[#d32f2f] font-semibold font-num">{stats.decliners}</span>
          </span>
        </div>
      </div>
    </div>
  );
}


/* ─── Market Breadth + Sentiment ─── */
function MarketBreadth({ stats }: { stats: { advancers: number; decliners: number; unchanged: number; totalStocks: number } }) {
  const { advancers, decliners, unchanged, totalStocks } = stats;
  const bullPct = totalStocks > 0 ? Math.round((advancers / totalStocks) * 100) : 50;
  let sentiment = 'Neutral', sColor = '#888';
  if (bullPct >= 65) { sentiment = 'Bullish'; sColor = '#0b8a00'; }
  else if (bullPct >= 55) { sentiment = 'Mild Bull'; sColor = '#1565c0'; }
  else if (bullPct <= 35) { sentiment = 'Bearish'; sColor = '#d32f2f'; }
  else if (bullPct <= 45) { sentiment = 'Mild Bear'; sColor = '#e65100'; }

  const donutData = [
    { name: 'Advancers', value: advancers, color: '#0b8a00' },
    { name: 'Decliners', value: decliners, color: '#d32f2f' },
    { name: 'Unchanged', value: unchanged, color: '#ccc' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="border border-[#e5e5e5] rounded p-4">
        <h3 className="text-sm font-semibold text-[#333] mb-3">Market Breadth</h3>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={24} outerRadius={38} dataKey="value" strokeWidth={1} stroke="#fff">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-[#333]">{totalStocks}</span>
            </div>
          </div>
          <div className="space-y-1.5 flex-1">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-[#666]">{d.name}</span>
                </div>
                <span className="text-xs font-semibold font-num" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-[#e5e5e5] rounded p-4">
        <h3 className="text-sm font-semibold text-[#333] mb-3">Market Sentiment</h3>
        <div className="flex flex-col items-center gap-3 pt-1">
          <span className="text-xl font-bold" style={{ color: sColor }}>{sentiment}</span>
          <div className="w-full">
            <div className="relative h-2 rounded-full bg-[#eee] overflow-hidden">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #d32f2f, #ffa726, #0b8a00)' }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#333] shadow" style={{ left: `calc(${bullPct}% - 6px)` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-[#999]">
              <span>Bear</span><span>Neutral</span><span>Bull</span>
            </div>
          </div>
          <span className="text-xs text-[#888]">Advancer Ratio: <strong className="font-num" style={{ color: sColor }}>{bullPct}%</strong></span>
        </div>
      </div>
    </div>
  );
}

/* ─── Portfolio Overview ─── */
function PortfolioOverview({ portfolio, learning }: { portfolio: any; learning: any }) {
  const items = [
    { label: 'Portfolio Value', val: formatCurrency(portfolio?.current_value || 0), sub: portfolio ? `${portfolio.total_profit_loss_percent >= 0 ? '+' : ''}${portfolio.total_profit_loss_percent.toFixed(2)}%` : undefined, subUp: portfolio?.total_profit_loss_percent >= 0 },
    { label: 'Invested', val: formatCurrency(portfolio?.total_invested || 0), sub: `${portfolio?.total_stocks || 0} stocks` },
    { label: 'Day P&L', val: formatCurrency(portfolio?.total_profit_loss || 0), subUp: portfolio?.total_profit_loss >= 0 },
    { label: 'Learning', val: `${learning?.progressPercent || 0}%`, sub: learning?.isQualified ? 'Qualified' : 'In progress' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {items.map(c => (
        <div key={c.label} className="border border-[#e5e5e5] rounded p-2.5 sm:p-3 min-w-0">
          <div className="text-[10px] sm:text-[11px] text-[#888] uppercase tracking-wide mb-1 truncate">{c.label}</div>
          <div className="text-sm sm:text-base font-bold font-num text-[#333] truncate">{c.val}</div>
          {c.sub && <div className={cn('text-xs font-num mt-0.5', c.subUp === true ? 'text-[#0b8a00]' : c.subUp === false ? 'text-[#d32f2f]' : 'text-[#888]')}>{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ─── Top Movers ─── */
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
    <div className="border border-[#e5e5e5] rounded overflow-hidden">
      <div className="flex items-center border-b border-[#e5e5e5] bg-[#f9f9f9] overflow-x-auto">
        {MOVER_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
              tab === t.key ? 'border-[#0b8a00] text-[#0b8a00] bg-white' : 'border-transparent text-[#888] hover:text-[#333]'
            )}>
            {t.label}
          </button>
        ))}
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
            <th className="w-8 px-3 py-2 text-left text-[11px] font-semibold text-[#888]">#</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-[#888]">Symbol</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold text-[#888]">LTP</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold text-[#888]">Chg %</th>
            {(tab === 'volume' || tab === 'trade') && (
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-[#888]">{tab === 'volume' ? 'Volume' : 'Trades'}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const up = s.change_pct >= 0;
            return (
              <tr key={s.symbol} className="border-b border-[#f0f0f0] hover:bg-[#f9f9f9] cursor-pointer" onClick={() => navigate(`/stock/${s.symbol}`)}>
                <td className="px-3 py-2 text-xs text-[#aaa] font-num">{i + 1}</td>
                <td className="px-3 py-2 font-semibold text-[#1565c0]">{s.symbol}</td>
                <td className="px-3 py-2 text-right font-num font-semibold">{s.ltp.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <span className={cn('font-num font-semibold', up ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                    {up ? '+' : ''}{s.change_pct.toFixed(2)}%
                  </span>
                </td>
                {(tab === 'volume' || tab === 'trade') && (
                  <td className="px-3 py-2 text-right text-xs font-num text-[#888]">{tab === 'volume' ? formatVolume(s.volume) : s.trades.toLocaleString()}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Most Active ─── */
function MostActive({ prices }: { prices: LivePrice[] }) {
  const navigate = useNavigate();
  const active = useMemo(() => [...prices].sort((a, b) => b.volume - a.volume).slice(0, 5), [prices]);
  return (
    <div className="border border-[#e5e5e5] rounded overflow-hidden">
      <div className="px-4 py-2.5 bg-[#f5f5f5] border-b border-[#e5e5e5]">
        <h3 className="text-sm font-semibold text-[#333]">Most Active</h3>
      </div>
      <table className="w-full">
        <tbody>
          {active.map(s => {
            const up = s.change_pct >= 0;
            return (
              <tr key={s.symbol} className="border-b border-[#f0f0f0] hover:bg-[#f9f9f9] cursor-pointer" onClick={() => navigate(`/stock/${s.symbol}`)}>
                <td className="px-4 py-2 font-semibold text-[#1565c0]">{s.symbol}</td>
                <td className="px-2 py-2 text-xs text-[#aaa] font-num">{formatVolume(s.volume)}</td>
                <td className="px-2 py-2 text-right font-num font-semibold">{s.ltp.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">
                  <span className={cn('font-num font-semibold text-xs', up ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                    {up ? '+' : ''}{s.change_pct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Day High / Low ─── */
function DayHighLow({ prices }: { prices: LivePrice[] }) {
  const nearHigh = useMemo(() => [...prices].filter(p => p.high > 0 && p.ltp >= p.high * 0.98).sort((a, b) => b.change_pct - a.change_pct).slice(0, 5), [prices]);
  const nearLow = useMemo(() => [...prices].filter(p => p.low > 0 && p.ltp <= p.low * 1.02).sort((a, b) => a.change_pct - b.change_pct).slice(0, 5), [prices]);

  const Panel = ({ title, data, color }: { title: string; data: LivePrice[]; color: string }) => (
    <div className="border border-[#e5e5e5] rounded overflow-hidden">
      <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#e5e5e5]">
        <h3 className="text-xs font-semibold" style={{ color }}>{title}</h3>
      </div>
      {data.length === 0 ? (
        <p className="px-4 py-3 text-xs text-[#aaa]">No stocks</p>
      ) : (
        <table className="w-full">
          <tbody>
            {data.map(s => (
              <tr key={s.symbol} className="border-b border-[#f0f0f0]">
                <td className="px-4 py-1.5 text-xs font-semibold text-[#333]">{s.symbol}</td>
                <td className="px-4 py-1.5 text-right text-xs font-num font-semibold" style={{ color }}>{s.ltp.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <Panel title="Near Day High" data={nearHigh} color="#0b8a00" />
      <Panel title="Near Day Low" data={nearLow} color="#d32f2f" />
    </div>
  );
}

/* ─── All Stocks Table ─── */
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
    <th className={cn('px-3 py-2 text-[11px] font-semibold text-[#888] cursor-pointer select-none hover:text-[#333]', right ? 'text-right' : 'text-left')} onClick={() => handleSort(k)}>
      {label}{sortKey === k && <span className="text-[#1565c0] ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );

  return (
    <div className="border border-[#e5e5e5] rounded overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between gap-3 bg-[#f9f9f9]">
        <div className="relative max-w-xs flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input type="text" placeholder="Search stocks..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-8 pr-3 py-1.5 rounded border border-[#ddd] bg-white text-sm text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-[#1565c0]"
          />
        </div>
        <span className="text-xs text-[#aaa]">{sorted.length} stocks</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
              <Th label="Symbol" k="symbol" />
              <Th label="LTP" k="ltp" right />
              <Th label="Chg %" k="change_pct" right />
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-[#888]">Change</th>
              <Th label="Volume" k="volume" right />
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-[#888] hidden lg:table-cell">High</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-[#888] hidden lg:table-cell">Low</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((s, i) => {
              const up = s.change_pct >= 0;
              return (
                <tr key={s.symbol} className={cn('border-b border-[#f0f0f0] hover:bg-[#f9f9f9] cursor-pointer', i % 2 === 1 && 'bg-[#fafafa]')} onClick={() => navigate(`/stock/${s.symbol}`)}>
                  <td className="px-3 py-2 font-semibold text-[#1565c0]">{s.symbol}</td>
                  <td className="px-3 py-2 text-right font-num font-semibold">{s.ltp.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={cn('font-num font-semibold', up ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                      {up ? '+' : ''}{s.change_pct.toFixed(2)}%
                    </span>
                  </td>
                  <td className={cn('px-3 py-2 text-right font-num text-xs', up ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                    {up ? '+' : ''}{s.change.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-num text-[#888]">{formatVolume(s.volume)}</td>
                  <td className="px-3 py-2 text-right text-xs font-num text-[#888] hidden lg:table-cell">{s.high.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-xs font-num text-[#888] hidden lg:table-cell">{s.low.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#e5e5e5] px-4 py-2 bg-[#f9f9f9]">
          <span className="text-xs text-[#aaa]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1 text-xs font-semibold border border-[#ddd] rounded hover:bg-[#f0f0f0] disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs font-semibold border border-[#ddd] rounded hover:bg-[#f0f0f0] disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
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
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin" /></div>}>
        <DemoDashboard />
      </Suspense>
    );
  }

  const isMarketOpen = isDseMarketOpen(market?.lastUpdated);

  return (
    <div className="animate-fade-in min-h-screen bg-white">
      {market && <StockTicker prices={market.livePrices} />}

      <div style={{ maxWidth: 1200, margin: '0 auto' }} className="px-3 sm:px-6 py-4 sm:py-5">
        <div className="space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#333] truncate">Welcome, {user?.full_name?.split(' ')[0] || 'Investor'}</h1>
              <span className="text-[10px] sm:text-xs text-[#aaa] flex items-center gap-1 shrink-0">
                <Clock size={11} />
                <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ExchangeToggle value="ALL" onChange={() => {}} size="sm" />
              <Link to="/trading" className="px-3 sm:px-4 py-2 rounded bg-[#0b8a00] text-white text-xs sm:text-sm font-semibold hover:bg-[#097300] transition-colors">
                Trade Now
              </Link>
            </div>
          </div>

          {/* DSEX Hero Landing */}
          {marketLoading ? (
            <div className="skeleton rounded h-40" />
          ) : market && (
            <DSEXHero indices={market.indices} stats={market.stats} isMarketOpen={isMarketOpen} lastUpdated={market.lastUpdated} />
          )}

          {/* Breadth + Sentiment */}
          {market && <MarketBreadth stats={market.stats} />}

          {/* Portfolio */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#333]">Portfolio Overview</h2>
              <Link to="/portfolio" className="text-xs text-[#1565c0] hover:underline flex items-center gap-0.5">Details <ChevronRight size={12} /></Link>
            </div>
            <PortfolioOverview portfolio={portfolio} learning={learning} />
          </div>

          {/* Holdings */}
          {portfolio && portfolio.items.length > 0 && (
            <div className="border border-[#e5e5e5] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f5] border-b border-[#e5e5e5]">
                <h2 className="text-sm font-semibold text-[#333]">Holdings</h2>
                <Link to="/portfolio" className="text-xs text-[#1565c0] hover:underline">View all</Link>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                    <th className="px-3 sm:px-4 py-2 text-left text-[11px] font-semibold text-[#888]">Stock</th>
                    <th className="px-2 sm:px-3 py-2 text-right text-[11px] font-semibold text-[#888]">Qty</th>
                    <th className="px-2 sm:px-3 py-2 text-right text-[11px] font-semibold text-[#888] hidden sm:table-cell">Avg</th>
                    <th className="px-2 sm:px-3 py-2 text-right text-[11px] font-semibold text-[#888]">LTP</th>
                    <th className="px-2 sm:px-3 py-2 text-right text-[11px] font-semibold text-[#888]">P&L</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-[11px] font-semibold text-[#888]">P&L%</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.items.slice(0, 8).map((item, i) => (
                    <tr key={item.id} className={cn('border-b border-[#f0f0f0] hover:bg-[#f9f9f9]', i % 2 === 1 && 'bg-[#fafafa]')}>
                      <td className="px-4 py-2">
                        <Link to={`/stock/${item.stock_symbol}`} className="font-semibold text-[#1565c0] hover:underline">{item.stock_symbol}</Link>
                      </td>
                      <td className="px-3 py-2 text-right font-num text-[#888]">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-num text-[#888] hidden sm:table-cell">{item.avg_buy_price.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-num font-semibold">{item.current_price.toFixed(2)}</td>
                      <td className={cn('px-3 py-2 text-right font-num font-semibold', item.profit_loss >= 0 ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                        {formatCurrency(item.profit_loss)}
                      </td>
                      <td className={cn('px-4 py-2 text-right font-num font-semibold text-xs', item.profit_loss_percent >= 0 ? 'text-[#0b8a00]' : 'text-[#d32f2f]')}>
                        {formatPercent(item.profit_loss_percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Top Movers */}
          {market && (
            <div>
              <h2 className="text-sm font-semibold text-[#333] mb-3">Top Movers</h2>
              <TopMovers prices={market.livePrices} />
            </div>
          )}

          {/* Most Active + Day High/Low */}
          {market && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MostActive prices={market.livePrices} />
              <DayHighLow prices={market.livePrices} />
            </div>
          )}

          {/* All Stocks */}
          {market && (
            <div>
              <h2 className="text-sm font-semibold text-[#333] mb-3">All Stocks</h2>
              <AllStocksTable prices={market.livePrices} />
            </div>
          )}

          {/* Alerts */}
          {(user?.kyc_status !== 'verified' || (learning && !learning.isQualified)) && (
            <div className="space-y-2">
              {user?.kyc_status !== 'verified' && (
                <div className="flex items-center gap-3 px-4 py-3 border border-[#e5e5e5] rounded border-l-3 border-l-[#e65100]">
                  <ShieldCheck size={16} className="text-[#e65100] shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#333]">Complete KYC</span>
                    <span className="text-xs text-[#888] ml-2">Submit documents to unlock trading</span>
                  </div>
                  <Link to="/kyc" className="text-xs font-semibold text-[#1565c0] hover:underline">Go →</Link>
                </div>
              )}
              {learning && !learning.isQualified && (
                <div className="flex items-center gap-3 px-4 py-3 border border-[#e5e5e5] rounded border-l-3 border-l-[#1565c0]">
                  <GraduationCap size={16} className="text-[#1565c0] shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#333]">Complete Learning</span>
                    <span className="text-xs text-[#888] ml-2">{learning.completedLessons}/{learning.totalLessons} lessons</span>
                  </div>
                  <Link to="/learning" className="text-xs font-semibold text-[#1565c0] hover:underline">Go →</Link>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/trading', label: 'Trade' },
              { to: '/portfolio', label: 'Portfolio' },
              { to: '/ipo', label: 'IPO' },
              { to: '/market', label: 'Market' },
              { to: '/learning', label: 'Learn' },
              { to: '/social', label: 'Social' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="px-4 py-2 text-xs font-semibold border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] text-[#333] transition-colors">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-[#e5e5e5] pt-3 flex items-center justify-between text-[11px] text-[#aaa]">
            <span>© {new Date().getFullYear()} HeroStock.AI — Regulated by BSEC</span>
            {market?.lastUpdated && <span className="font-num">Last updated: {new Date(market.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>

        </div>
      </div>
    </div>
  );
}
