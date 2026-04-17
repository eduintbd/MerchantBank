import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { useSocialMediaPosts } from '@/hooks/useSocialMedia';
import { useNewsComments, useCreateNewsComment } from '@/hooks/useNewsComments';
import { MarketIndexCards } from '@/components/dashboard/MarketIndexCards';
import { ExchangeToggle, type ExchangeFilter } from '@/components/ui/ExchangeToggle';
import { MarketStrength } from '@/components/dashboard/MarketStrength';
import { MarketSentiment } from '@/components/dashboard/MarketSentiment';
import { GlobalExchangeComparison } from '@/components/dashboard/GlobalExchangeComparison';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatVolume, formatValueBn, formatDateTime, cn } from '@/lib/utils';
import { isDseMarketOpen } from '@/lib/market-hours';
import {
  BarChart3, Search, TrendingUp, TrendingDown, Activity,
  Layers, Newspaper, Clock, ExternalLink, ArrowRight,
  ChevronRight, Zap, LayoutDashboard, MessageCircle, ThumbsUp, Share2, Send, Globe,
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

const PLATFORM_ICONS: Record<string, { label: string; color: string }> = {
  twitter: { label: '𝕏', color: 'bg-black/10 text-foreground' },
  reddit: { label: 'R', color: 'bg-orange-500/10 text-orange-500' },
  youtube: { label: '▶', color: 'bg-red-500/10 text-red-500' },
  facebook: { label: 'f', color: 'bg-blue-500/10 text-blue-500' },
  tiktok: { label: '♪', color: 'bg-pink-500/10 text-pink-500' },
  linkedin: { label: 'in', color: 'bg-blue-600/10 text-blue-600' },
  news: { label: 'N', color: 'bg-gray-500/10 text-gray-400' },
};

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
  const changePct = price.change_pct ?? 0;
  const isGain = changePct > 0;
  const isLoss = changePct < 0;

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
        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
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

function NewsCommentSection({ postId }: { postId: string }) {
  const { data: comments = [], isLoading } = useNewsComments(postId);
  const createComment = useCreateNewsComment();
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    createComment.mutate({ post_id: postId, content: text.trim() }, {
      onSuccess: () => setText(''),
    });
  };

  return (
    <div className="mt-2 pt-2 border-t border-border/30">
      {isLoading ? (
        <p className="text-[10px] text-muted">Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-1.5 mb-2">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                {c.author_name?.charAt(0) || '?'}
              </div>
              <div>
                <span className="text-[10px] font-semibold text-foreground">{c.author_name}</span>
                <span className="text-[10px] text-muted ml-1.5">{timeAgo(c.created_at)}</span>
                <p className="text-[11px] text-foreground/80 leading-snug">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Add a comment..."
          className="flex-1 text-[11px] bg-surface border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-info/50 placeholder:text-muted/50"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || createComment.isPending}
          className="px-2 py-1.5 bg-primary text-white rounded-lg text-[10px] font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  );
}

function MarketNews() {
  const { data: posts = [], isLoading } = useSocialMediaPosts({ limit: 20 });
  const [showAll, setShowAll] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const displayPosts = showAll ? posts : posts.slice(0, 5);

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper size={16} className="text-info" />
          <h3 className="text-sm font-semibold tracking-wide">Market News & Updates</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton rounded-lg h-16" />)}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-info" />
          <h3 className="text-sm font-semibold tracking-wide">Market News & Updates</h3>
        </div>
        <span className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded-full font-num">
          {posts.length} posts · Auto-refreshes
        </span>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No posts yet. Scanner runs every 30 min.</p>
      ) : (
        <div className="space-y-0">
          {displayPosts.map((post, i) => {
            const platform = PLATFORM_ICONS[post.platform] || PLATFORM_ICONS.news;
            return (
              <div key={post.id} className={cn('py-3', i > 0 && 'border-t border-border/50')}>
                <div className="flex gap-3">
                  {/* Platform icon + sentiment */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold', platform.color)}>
                      {platform.label}
                    </div>
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      post.sentiment === 'positive' && 'bg-success',
                      post.sentiment === 'negative' && 'bg-danger',
                      post.sentiment === 'neutral' && 'bg-warning',
                      post.sentiment === 'mixed' && 'bg-info',
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Author + time */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-foreground">{post.author_name}</span>
                      {post.author_verified && <span className="text-[9px] text-info">✓</span>}
                      {post.author_handle && <span className="text-[10px] text-muted">{post.author_handle}</span>}
                      <span className="text-[10px] text-muted flex items-center gap-1 ml-auto">
                        <Clock size={9} />
                        {timeAgo(post.posted_at)}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-[12px] text-foreground/90 leading-relaxed line-clamp-3 whitespace-pre-line">{post.content}</p>

                    {/* Symbols + category */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {(post.symbols || []).map(s => (
                        <span key={s} className="text-[10px] font-bold text-primary bg-primary/8 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded capitalize',
                        post.category === 'market' && 'bg-info/10 text-info',
                        post.category === 'stock' && 'bg-purple/10 text-purple',
                        post.category === 'regulation' && 'bg-warning/10 text-warning',
                        post.category === 'ipo' && 'bg-success/10 text-success',
                        post.category === 'breaking' && 'bg-danger/10 text-danger',
                        post.category === 'analysis' && 'bg-purple/10 text-purple',
                        (!post.category || post.category === 'general' || post.category === 'opinion') && 'bg-white/5 text-muted',
                      )}>
                        {post.category || 'general'}
                      </span>
                    </div>

                    {/* Engagement + comment toggle */}
                    <div className="flex items-center gap-3 mt-2">
                      {post.likes_count > 0 && (
                        <span className="text-[10px] text-muted flex items-center gap-1"><ThumbsUp size={10} />{post.likes_count}</span>
                      )}
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="text-[10px] text-muted flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <MessageCircle size={10} />
                        Comment
                      </button>
                      {post.shares_count > 0 && (
                        <span className="text-[10px] text-muted flex items-center gap-1"><Share2 size={10} />{post.shares_count}</span>
                      )}
                      {post.post_url && (
                        <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted flex items-center gap-1 hover:text-info transition-colors ml-auto">
                          <ExternalLink size={10} />
                          Source
                        </a>
                      )}
                    </div>

                    {/* Comments section */}
                    {expandedComments.has(post.id) && <NewsCommentSection postId={post.id} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {posts.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full mt-3 pt-3 border-t border-border text-xs font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? 'Show less' : `View all ${posts.length} posts`}
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
                const changePct = p.change_pct ?? 0;
                const isGain = changePct > 0;
                const isLoss = changePct < 0;
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
                        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl" style={{ borderBottom: '1px solid #e1e5ee' }}>
      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-[56px] sm:h-[60px]">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a2744] to-[#2a3f6b] flex items-center justify-center shadow-sm">
              <span className="text-[#c9a96e] font-bold text-sm">A</span>
            </div>
            <div>
              <span className="font-bold text-base text-[#1a2138] tracking-tight">Abaci<span className="text-[#c9a96e]"> Investments</span></span>
              <p className="text-[10px] text-[#9ba3b5] leading-none mt-0.5 hidden sm:block font-medium tracking-wider uppercase">Capital Markets</p>
            </div>
          </Link>

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

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1a2744] to-[#2a3f6b] text-white rounded-xl text-xs font-semibold hover:shadow-md transition-all"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
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
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter>('ALL');

  if (error) return (
    <div className="min-h-screen bg-white">
      <PublicHeader isMarketOpen={false} />
      <div className="flex items-center justify-center h-64">
        <p className="text-muted text-sm">Failed to load market data</p>
      </div>
    </div>
  );

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader isMarketOpen={false} />
        <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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

  const isMarketOpen = isDseMarketOpen(data.lastUpdated);
  const movers = getTopMovers(data.livePrices, activeTab);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader isMarketOpen={isMarketOpen} />

      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="animate-fade-in space-y-5">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BarChart3 size={24} className="text-info" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">DSE & CSE Market</h1>
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
                Real-time DSE & CSE market data &middot; {data.stats.totalStocks} stocks &middot; Auto-refreshes every 30s
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExchangeToggle value={exchangeFilter} onChange={setExchangeFilter} size="sm" />
              {data.lastUpdated && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <Activity size={12} className={isMarketOpen ? 'text-success animate-pulse' : 'text-muted'} />
                  <span>Last updated {formatDateTime(data.lastUpdated)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticker Strip */}
          <TickerStrip prices={data.livePrices} />

          {/* Index Cards + Stats */}
          <MarketIndexCards indices={data.indices} stats={data.stats} exchange={exchangeFilter} />

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

          {/* Global Exchange Comparison */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-info" />
              <h3 className="text-sm font-semibold tracking-wide">Global Exchange Comparison</h3>
              <span className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded-full">NASDAQ vs DSE vs PSX vs BSE vs CSE</span>
            </div>
            <GlobalExchangeComparison variant="light" />
          </Card>

          {/* Full Stock Table */}
          <StockTable prices={data.livePrices} />

          {/* CTA Banner */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">Want more? Join Abaci Investments</h3>
              <p className="text-sm text-muted">Get portfolio tracking, AI analysis, demo trading, learning courses &amp; more.</p>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
