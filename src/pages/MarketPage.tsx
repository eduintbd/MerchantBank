import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketIndexCards } from '@/components/dashboard/MarketIndexCards';
import { MarketStrength } from '@/components/dashboard/MarketStrength';
import { MarketSentiment } from '@/components/dashboard/MarketSentiment';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatVolume, formatValueBn, formatDateTime, cn } from '@/lib/utils';
import {
  BarChart3, Search, TrendingUp, TrendingDown, Activity,
  Layers, Newspaper, Clock, ExternalLink, ArrowRight,
  ChevronRight, Zap, LogIn,
} from 'lucide-react';
import type { LivePrice, TopMoverTab } from '@/types';

type SortKey = 'symbol' | 'ltp' | 'change_pct' | 'volume' | 'value_traded' | 'trades';
type SortDir = 'asc' | 'desc';

const topMoverTabs: { key: TopMoverTab; label: string }[] = [
  { key: 'gainer', label: 'Top Gainers' },
  { key: 'loser', label: 'Top Losers' },
  { key: 'volume', label: 'Most Active' },
  { key: 'value', label: 'Highest Value' },
  { key: 'trade', label: 'Most Trades' },
];

// Sample market news — will be replaced with QuantBD API feed
const MARKET_NEWS = [
  {
    id: '1',
    headline: 'DSEX crosses 5,800 mark as banking stocks rally',
    summary: 'The benchmark DSEX index gained 1.2% driven by strong performance from banking sector stocks including BRACBANK, DUTCHBANGLA, and EBL.',
    source: 'DSE',
    category: 'Market',
    published_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    symbol: 'DSEX',
    sentiment: 'positive' as const,
  },
  {
    id: '2',
    headline: 'BSEC approves new margin loan guidelines for retail investors',
    summary: 'Bangladesh Securities and Exchange Commission has issued updated guidelines allowing higher margin ratios for qualified retail investors.',
    source: 'BSEC',
    category: 'Regulation',
    published_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    sentiment: 'neutral' as const,
  },
  {
    id: '3',
    headline: 'GP declares 12% interim cash dividend for FY2025-26',
    summary: 'Grameenphone Limited has declared 12% interim cash dividend. Record date set for April 5, 2026.',
    source: 'DSE Filing',
    category: 'Corporate',
    published_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    symbol: 'GP',
    sentiment: 'positive' as const,
  },
  {
    id: '4',
    headline: 'Foreign investors net sellers for third consecutive week',
    summary: 'Foreign institutional investors sold BDT 245Cr worth of stocks this week, with pharma and textile sectors seeing the highest outflows.',
    source: 'Market Analysis',
    category: 'Market',
    published_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    sentiment: 'negative' as const,
  },
  {
    id: '5',
    headline: 'BEXIMCO Pharma receives WHO prequalification for new drug',
    summary: 'BEXIMCO Pharmaceuticals has received WHO prequalification for a new antibiotic formulation, opening up export opportunities.',
    source: 'Company',
    category: 'Corporate',
    published_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    symbol: 'BXPHARMA',
    sentiment: 'positive' as const,
  },
  {
    id: '6',
    headline: 'IPO subscription opens for TechBangla Limited tomorrow',
    summary: 'TechBangla Limited IPO subscription window opens March 14. Fixed price method at BDT 30 per share, lot size 500 shares.',
    source: 'DSE',
    category: 'IPO',
    published_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    sentiment: 'neutral' as const,
  },
  {
    id: '7',
    headline: 'Market turnover hits BDT 1,200Cr — highest in 3 months',
    summary: 'Daily turnover on DSE reached BDT 1,200 Crore, the highest single-day turnover in the last three months, signaling renewed investor confidence.',
    source: 'DSE',
    category: 'Market',
    published_at: new Date(Date.now() - 30 * 3600000).toISOString(),
    sentiment: 'positive' as const,
  },
  {
    id: '8',
    headline: 'Bangladesh Bank keeps policy rate unchanged at 8.5%',
    summary: 'The central bank maintained its key policy rate at 8.5% in the latest monetary policy review, providing stability for equity markets.',
    source: 'Bangladesh Bank',
    category: 'Economy',
    published_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    sentiment: 'neutral' as const,
  },
];

function getTopMovers(prices: LivePrice[], tab: TopMoverTab): LivePrice[] {
  const arr = [...prices];
  switch (tab) {
    case 'gainer':
      return arr.filter(p => p.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct).slice(0, 5);
    case 'loser':
      return arr.filter(p => p.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 5);
    case 'volume':
      return arr.sort((a, b) => b.volume - a.volume).slice(0, 5);
    case 'value':
      return arr.sort((a, b) => b.value_traded - a.value_traded).slice(0, 5);
    case 'trade':
      return arr.sort((a, b) => b.trades - a.trades).slice(0, 5);
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function MoverCard({ price, rank }: { price: LivePrice; rank: number }) {
  const isGain = price.change_pct > 0;
  const isLoss = price.change_pct < 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface hover:bg-card-hover transition-colors">
      <span className="text-[10px] text-muted/50 font-num w-4 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{price.symbol}</p>
        <p className="text-[11px] text-muted font-num">{formatCurrency(price.ltp)}</p>
      </div>
      <span className={cn(
        'px-2 py-0.5 rounded-full text-xs font-bold font-num',
        isGain && 'bg-success/15 text-success',
        isLoss && 'bg-danger/15 text-danger',
        !isGain && !isLoss && 'bg-white/5 text-muted'
      )}>
        {price.change_pct >= 0 ? '+' : ''}{price.change_pct.toFixed(2)}%
      </span>
    </div>
  );
}

function SectorBreakdown({ prices }: { prices: LivePrice[] }) {
  const totalVolume = prices.reduce((s, p) => s + (p.volume || 0), 0);
  const advancers = prices.filter(p => p.change_pct > 0).length;
  const decliners = prices.filter(p => p.change_pct < 0).length;
  const unchanged = prices.length - advancers - decliners;

  const segments = [
    { label: 'Advancers', count: advancers, pct: prices.length ? (advancers / prices.length * 100) : 0, color: 'bg-success', text: 'text-success' },
    { label: 'Decliners', count: decliners, pct: prices.length ? (decliners / prices.length * 100) : 0, color: 'bg-danger', text: 'text-danger' },
    { label: 'Unchanged', count: unchanged, pct: prices.length ? (unchanged / prices.length * 100) : 0, color: 'bg-gray-500', text: 'text-muted' },
  ];

  return (
    <Card>
      <h3 className="text-sm font-semibold tracking-wide mb-4">Market Breadth</h3>
      <div className="flex h-4 rounded-full overflow-hidden mb-4">
        {segments.map(s => (
          <div key={s.label} className={cn(s.color, 'transition-all')} style={{ width: `${s.pct}%` }} />
        ))}
      </div>
      <div className="space-y-2">
        {segments.map(s => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', s.color)} />
              <span className="text-xs text-muted">{s.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('text-sm font-bold font-num', s.text)}>{s.count}</span>
              <span className="text-[11px] text-muted font-num w-12 text-right">{s.pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs">
        <span className="text-muted">Total Volume</span>
        <span className="font-bold font-num text-foreground">{formatVolume(totalVolume)}</span>
      </div>
    </Card>
  );
}

function TickerStrip({ prices }: { prices: LivePrice[] }) {
  const tickerItems = [...prices].sort((a, b) => b.volume - a.volume).slice(0, 25);
  if (tickerItems.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm">
      <div className="flex animate-marquee whitespace-nowrap py-2.5">
        {[...tickerItems, ...tickerItems].map((p, i) => (
          <span key={`${p.symbol}-${i}`} className="inline-flex items-center gap-1.5 mx-4 text-xs">
            <span className="font-semibold text-foreground">{p.symbol}</span>
            <span className="font-num tabular-nums text-foreground/70">{formatCurrency(p.ltp)}</span>
            <span className={cn(
              'font-num tabular-nums font-semibold',
              p.change_pct > 0 ? 'text-success' : p.change_pct < 0 ? 'text-danger' : 'text-muted'
            )}>
              {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent pointer-events-none" />
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

function MarketNews() {
  const [showAll, setShowAll] = useState(false);
  const displayNews = showAll ? MARKET_NEWS : MARKET_NEWS.slice(0, 4);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-info" />
          <h3 className="text-sm font-semibold tracking-wide">Market News & Updates</h3>
        </div>
        <span className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded-full font-num">{MARKET_NEWS.length} articles</span>
      </div>

      <div className="space-y-0">
        {displayNews.map((news, i) => (
          <div key={news.id} className={cn(
            'group py-3 flex gap-3',
            i > 0 && 'border-t border-border/50'
          )}>
            {/* Sentiment indicator */}
            <div className="flex-shrink-0 mt-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                news.sentiment === 'positive' && 'bg-success',
                news.sentiment === 'negative' && 'bg-danger',
                news.sentiment === 'neutral' && 'bg-warning',
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h4 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                  {news.headline}
                </h4>
              </div>

              <p className="text-[11px] text-muted leading-relaxed mt-1 line-clamp-2">{news.summary}</p>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {news.symbol && (
                  <span className="text-[10px] font-bold text-primary bg-primary/8 px-1.5 py-0.5 rounded">
                    {news.symbol}
                  </span>
                )}
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded',
                  news.category === 'Market' && 'bg-info/10 text-info',
                  news.category === 'Corporate' && 'bg-purple/10 text-purple',
                  news.category === 'Regulation' && 'bg-warning/10 text-warning',
                  news.category === 'IPO' && 'bg-success/10 text-success',
                  news.category === 'Economy' && 'bg-gold/10 text-gold',
                )}>
                  {news.category}
                </span>
                <span className="text-[10px] text-muted flex items-center gap-1">
                  <Clock size={9} />
                  {timeAgo(news.published_at)}
                </span>
                <span className="text-[10px] text-muted/60">{news.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {MARKET_NEWS.length > 4 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full mt-3 pt-3 border-t border-border text-xs font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? 'Show less' : `View all ${MARKET_NEWS.length} articles`}
          <ChevronRight size={12} className={cn('transition-transform', showAll && 'rotate-90')} />
        </button>
      )}
    </Card>
  );
}

function StockTable({ prices }: { prices: LivePrice[] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterMode, setFilterMode] = useState<'all' | 'gainers' | 'losers' | 'active'>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...prices];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.symbol.toLowerCase().includes(q));
    }

    switch (filterMode) {
      case 'gainers': result = result.filter(p => p.change_pct > 0); break;
      case 'losers': result = result.filter(p => p.change_pct < 0); break;
      case 'active': result = result.filter(p => p.volume > 0); break;
    }

    result.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return result;
  }, [prices, search, sortKey, sortDir, filterMode]);

  const SortHeader = ({ label, field, align }: { label: string; field: SortKey; align?: string }) => (
    <th
      className={cn('px-2 py-3 font-medium cursor-pointer hover:text-foreground transition-colors select-none', align)}
      onClick={() => handleSort(field)}
    >
      <div className={cn('flex items-center gap-1', align === 'text-right' && 'justify-end')}>
        {label}
        {sortKey === field && (
          <span className="text-info">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <Card padding={false}>
      <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-info" />
            <h3 className="text-sm font-semibold tracking-wide">All Stocks</h3>
            <span className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded-full font-num">{filtered.length}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-info/50 focus:border-info/50 placeholder:text-muted/50"
            />
          </div>

          <div className="flex gap-1 p-0.5 bg-surface rounded-xl">
            {([
              { key: 'all', label: 'All' },
              { key: 'gainers', label: 'Gainers' },
              { key: 'losers', label: 'Losers' },
              { key: 'active', label: 'Active' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilterMode(f.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  filterMode === f.key ? 'bg-info text-white shadow-sm' : 'text-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
              <th className="pl-4 sm:pl-5 pr-2 py-3 font-medium w-8">#</th>
              <SortHeader label="Symbol" field="symbol" />
              <SortHeader label="LTP" field="ltp" align="text-right" />
              <SortHeader label="CHG%" field="change_pct" align="text-right" />
              <SortHeader label="High" field="ltp" align="text-right" />
              <SortHeader label="Low" field="ltp" align="text-right" />
              <SortHeader label="Volume" field="volume" align="text-right" />
              <SortHeader label="Value" field="value_traded" align="text-right" />
              <th className="pl-2 pr-4 sm:pr-5 py-3 font-medium text-right">Trades</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-muted text-sm">
                  No stocks match your search
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => {
                const isGain = p.change_pct > 0;
                const isLoss = p.change_pct < 0;
                return (
                  <tr
                    key={p.symbol}
                    onClick={() => navigate(`/stock/${p.symbol}`)}
                    className="border-t border-border/30 hover:bg-card-hover/50 transition-colors cursor-pointer group"
                  >
                    <td className="pl-4 sm:pl-5 pr-2 py-2.5 relative">
                      <div className={cn(
                        'absolute left-0 top-1 bottom-1 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                        isGain ? 'bg-success' : isLoss ? 'bg-danger' : 'bg-border'
                      )} />
                      <span className="text-[11px] text-muted/50 font-num">{i + 1}</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="font-semibold text-[13px] text-foreground">{p.symbol}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className="font-num text-[13px] font-medium">{formatCurrency(p.ltp)}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[60px] px-2 py-0.5 rounded-full text-xs font-bold font-num',
                        isGain && 'bg-success/15 text-success',
                        isLoss && 'bg-danger/15 text-danger',
                        !isGain && !isLoss && 'bg-white/5 text-muted'
                      )}>
                        {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right text-[12px] text-muted font-num">{formatCurrency(p.high)}</td>
                    <td className="px-2 py-2.5 text-right text-[12px] text-muted font-num">{formatCurrency(p.low)}</td>
                    <td className="px-2 py-2.5 text-right text-[12px] font-num text-foreground/80">{formatVolume(p.volume)}</td>
                    <td className="px-2 py-2.5 text-right text-[12px] font-num text-foreground/80">{formatValueBn(p.value_traded)}</td>
                    <td className="pl-2 pr-4 sm:pr-5 py-2.5 text-right text-[12px] font-num text-muted">{(p.trades || 0).toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PublicHeader({ isMarketOpen }: { isMarketOpen: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-[56px] sm:h-[60px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <div>
              <span className="font-bold text-base text-foreground tracking-tight">HeroStock<span className="text-primary">.AI</span></span>
              <p className="text-[10px] text-muted leading-none mt-0.5 hidden sm:block">DSE Market Data</p>
            </div>
          </Link>

          {/* Center — Market Status */}
          <div className="hidden sm:flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border',
              isMarketOpen
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-danger/30 bg-danger/10 text-danger'
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                isMarketOpen ? 'bg-success animate-pulse' : 'bg-danger'
              )} />
              {isMarketOpen ? 'Market Open' : 'Market Closed'}
            </div>
          </div>

          {/* Right — Sign In CTA */}
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function MarketPage() {
  const { data, isLoading, error } = useMarketData();
  const [activeTab, setActiveTab] = useState<TopMoverTab>('gainer');

  if (error) return (
    <div className="min-h-screen bg-background">
      <PublicHeader isMarketOpen={false} />
      <div className="flex items-center justify-center h-64">
        <p className="text-muted text-sm">Failed to load market data</p>
      </div>
    </div>
  );

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader isMarketOpen={false} />
        <div className="mx-auto max-w-7xl px-2 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8">
          <div className="animate-fade-in space-y-4">
            <div className="skeleton rounded-xl h-10 w-64" />
            <div className="skeleton rounded-xl h-[40px]" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton rounded-xl h-[100px]" />)}
            </div>
            <div className="skeleton rounded-2xl h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const lastUpdate = data.lastUpdated ? new Date(data.lastUpdated) : null;
  const timeDiffMin = lastUpdate ? (now.getTime() - lastUpdate.getTime()) / 60000 : Infinity;
  const isMarketOpen = timeDiffMin < 10;
  const movers = getTopMovers(data.livePrices, activeTab);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader isMarketOpen={isMarketOpen} />

      <div className="mx-auto max-w-7xl px-2 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div className="animate-fade-in space-y-5">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BarChart3 size={24} className="text-info" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">DSE Market</h1>
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border sm:hidden',
                  isMarketOpen
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-danger/30 bg-danger/10 text-danger'
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isMarketOpen ? 'bg-success animate-pulse' : 'bg-danger'
                  )} />
                  {isMarketOpen ? 'Open' : 'Closed'}
                </div>
              </div>
              <p className="text-muted text-sm">
                Real-time DSE market data &middot; {data.stats.totalStocks} stocks &middot; Auto-refreshes every 30s
              </p>
            </div>
            {data.lastUpdated && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <Activity size={12} className={isMarketOpen ? 'text-success animate-pulse' : 'text-muted'} />
                <span>Last updated {formatDateTime(data.lastUpdated)}</span>
              </div>
            )}
          </div>

          {/* Ticker Strip */}
          <TickerStrip prices={data.livePrices} />

          {/* Index Cards + Stats */}
          <MarketIndexCards indices={data.indices} stats={data.stats} />

          {/* Top Movers + News */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Top Movers */}
            <Card className="lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-warning" />
                  <h3 className="text-sm font-semibold tracking-wide">Top Movers</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {topMoverTabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all',
                      activeTab === t.key ? 'bg-info text-white' : 'text-muted bg-surface hover:text-foreground'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                {movers.length === 0 ? (
                  <p className="text-muted text-xs py-6 text-center">No data</p>
                ) : (
                  movers.map((p, i) => <MoverCard key={p.symbol} price={p} rank={i + 1} />)
                )}
              </div>
            </Card>

            {/* Market News */}
            <div className="lg:col-span-2">
              <MarketNews />
            </div>
          </div>

          {/* Strength + Sentiment + Breadth */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <MarketStrength stats={data.stats} />
            <MarketSentiment sentiment={data.sentiment} advancerRatio={data.advancerRatio} />
            <SectorBreakdown prices={data.livePrices} />
          </div>

          {/* Market Summary */}
          <Card>
            <h3 className="text-sm font-semibold tracking-wide mb-3">Market Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Total Volume</p>
                <p className="text-xl font-bold font-num">{formatVolume(data.stats.totalVolume)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Total Value</p>
                <p className="text-xl font-bold font-num">{formatValueBn(data.stats.totalValue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Total Trades</p>
                <p className="text-xl font-bold font-num">{(data.stats.totalTrades).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Active Stocks</p>
                <p className="text-xl font-bold font-num">{data.stats.totalStocks}</p>
              </div>
            </div>
          </Card>

          {/* Full Stock Table */}
          <StockTable prices={data.livePrices} />

          {/* CTA Banner */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">Want more? Join HeroStock.AI</h3>
              <p className="text-sm text-muted">Get portfolio tracking, AI analysis, demo trading, learning courses &amp; more.</p>
            </div>
            <Link
              to="/auth"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
