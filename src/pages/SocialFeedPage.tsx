import { useState, useMemo } from 'react';
import { usePosts, useCreatePost, useLikePost, usePostComments, useCreateComment } from '@/hooks/useSocial';
import { useSocialMediaPosts, useTrendingSymbols, type SocialMediaPost } from '@/hooks/useSocialMedia';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Send, Hash, TrendingUp, Users, ExternalLink,
  ThumbsUp, Share2, Eye, CheckCircle, RefreshCw, Newspaper,
  BarChart2, AlertTriangle, Flame, Globe, Clock, BookOpen,
  Bookmark, ArrowUpRight, Zap, Radio,
} from 'lucide-react';

// ─── Constants ───
const PLATFORM_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  twitter:  { label: '𝕏', icon: '𝕏', color: 'text-foreground', bg: 'bg-black/5' },
  facebook: { label: 'FB', icon: 'f', color: 'text-blue-600', bg: 'bg-blue-50' },
  reddit:   { label: 'Reddit', icon: 'r/', color: 'text-orange-600', bg: 'bg-orange-50' },
  youtube:  { label: 'YouTube', icon: '▶', color: 'text-red-600', bg: 'bg-red-50' },
  linkedin: { label: 'LinkedIn', icon: 'in', color: 'text-blue-700', bg: 'bg-blue-50' },
  news:     { label: 'News', icon: '📰', color: 'text-gray-600', bg: 'bg-gray-50' },
};

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  positive: { label: 'Bullish', color: 'text-[#00c48c]', bg: 'bg-[#00c48c]/10', icon: TrendingUp },
  negative: { label: 'Bearish', color: 'text-[#ff4d6a]', bg: 'bg-[#ff4d6a]/10', icon: AlertTriangle },
  neutral:  { label: 'Neutral', color: 'text-muted', bg: 'bg-surface', icon: BarChart2 },
  mixed:    { label: 'Mixed', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Zap },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  breaking:   { label: 'Breaking', color: 'text-red-600', bg: 'bg-red-50' },
  market:     { label: 'Market', color: 'text-blue-600', bg: 'bg-blue-50' },
  stock:      { label: 'Stock', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  analysis:   { label: 'Analysis', color: 'text-purple-600', bg: 'bg-purple-50' },
  ipo:        { label: 'IPO', color: 'text-orange-600', bg: 'bg-orange-50' },
  regulation: { label: 'Regulation', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  opinion:    { label: 'Opinion', color: 'text-pink-600', bg: 'bg-pink-50' },
  general:    { label: 'General', color: 'text-muted', bg: 'bg-surface' },
};

type TabType = 'headlines' | 'analysis' | 'community';
type CategoryFilter = 'all' | 'breaking' | 'market' | 'stock' | 'analysis' | 'ipo' | 'regulation' | 'opinion';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

// ─── Featured/Breaking News Card ───
function FeaturedNewsCard({ post }: { post: SocialMediaPost }) {
  const sentiment = SENTIMENT_CONFIG[post.sentiment] || SENTIMENT_CONFIG.neutral;
  const category = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.general;
  const SentimentIcon = sentiment.icon;

  return (
    <div className="rounded-xl border border-border bg-card-solid overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all group">
      {/* Category strip */}
      <div className={cn('px-4 py-2 flex items-center justify-between', category.bg)}>
        <div className="flex items-center gap-2">
          {post.category === 'breaking' && <Radio size={12} className="text-red-600 animate-pulse" />}
          <span className={cn('text-xs font-bold uppercase tracking-wider', category.color)}>{category.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', sentiment.bg, sentiment.color)}>
            <SentimentIcon size={10} /> {sentiment.label}
          </span>
          <span className="text-[10px] text-muted">{timeAgo(post.posted_at)}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
            PLATFORM_CONFIG[post.platform]?.bg || 'bg-surface',
            PLATFORM_CONFIG[post.platform]?.color || 'text-muted'
          )}>
            {PLATFORM_CONFIG[post.platform]?.icon || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground truncate">{post.author_name}</span>
              {post.author_verified && <CheckCircle size={12} className="text-primary shrink-0" />}
            </div>
            {post.author_handle && (
              <span className="text-[10px] text-muted">@{post.author_handle.replace('@', '')}</span>
            )}
          </div>
          <span className="text-[10px] text-muted uppercase font-semibold">{PLATFORM_CONFIG[post.platform]?.label}</span>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Symbol Tags */}
        {post.symbols && post.symbols.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.symbols.map(s => (
              <Link
                key={s}
                to={`/stock/${s}`}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
              >
                <ArrowUpRight size={10} />${s}
              </Link>
            ))}
          </div>
        )}

        {/* Engagement + Link */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1"><ThumbsUp size={12} /> <span className="font-num">{post.likes_count.toLocaleString()}</span></span>
          )}
          {post.comments_count > 0 && (
            <span className="flex items-center gap-1"><MessageCircle size={12} /> <span className="font-num">{post.comments_count.toLocaleString()}</span></span>
          )}
          {post.shares_count > 0 && (
            <span className="flex items-center gap-1"><Share2 size={12} /> <span className="font-num">{post.shares_count.toLocaleString()}</span></span>
          )}
          {post.views_count > 0 && (
            <span className="flex items-center gap-1"><Eye size={12} /> <span className="font-num">{post.views_count.toLocaleString()}</span></span>
          )}
          {post.post_url && (
            <a href={post.post_url} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium">
              Read more <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Compact News Row ───
function NewsRow({ post }: { post: SocialMediaPost }) {
  const sentiment = SENTIMENT_CONFIG[post.sentiment] || SENTIMENT_CONFIG.neutral;
  const category = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.general;

  return (
    <div className="flex gap-3 py-3.5 border-b border-border/50 last:border-0 hover:bg-surface/50 transition-colors px-1 rounded">
      <div className={cn('w-1 rounded-full shrink-0 self-stretch',
        post.sentiment === 'positive' ? 'bg-[#00c48c]' : post.sentiment === 'negative' ? 'bg-[#ff4d6a]' : 'bg-border'
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', category.bg, category.color)}>
            {category.label}
          </span>
          <span className="text-[10px] text-muted">{timeAgo(post.posted_at)}</span>
          <span className="text-[10px] text-muted ml-auto uppercase">{PLATFORM_CONFIG[post.platform]?.label}</span>
        </div>
        <p className="text-sm text-foreground leading-snug line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted font-medium">{post.author_name}</span>
          {post.symbols && post.symbols.length > 0 && (
            <div className="flex gap-1">
              {post.symbols.slice(0, 3).map(s => (
                <Link key={s} to={`/stock/${s}`} className="text-[10px] font-semibold text-primary hover:underline">${s}</Link>
              ))}
            </div>
          )}
          {post.post_url && (
            <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-muted hover:text-primary">
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Market Pulse Summary ───
function MarketPulse({ posts }: { posts: SocialMediaPost[] }) {
  const stats = useMemo(() => {
    const total = posts.length;
    const positive = posts.filter(p => p.sentiment === 'positive').length;
    const negative = posts.filter(p => p.sentiment === 'negative').length;
    const bullPct = total > 0 ? Math.round((positive / total) * 100) : 50;
    const bearPct = total > 0 ? Math.round((negative / total) * 100) : 50;
    const breaking = posts.filter(p => p.category === 'breaking').length;
    const topSymbols: Record<string, number> = {};
    posts.forEach(p => (p.symbols || []).forEach(s => { topSymbols[s] = (topSymbols[s] || 0) + 1; }));
    const trendingSymbols = Object.entries(topSymbols).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { total, positive, negative, bullPct, bearPct, breaking, trendingSymbols };
  }, [posts]);

  const sentiment = stats.bullPct >= 60 ? 'Bullish' : stats.bearPct >= 60 ? 'Bearish' : 'Neutral';
  const sentimentColor = sentiment === 'Bullish' ? 'text-[#00c48c]' : sentiment === 'Bearish' ? 'text-[#ff4d6a]' : 'text-muted';

  return (
    <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-3">
        <Radio size={14} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Market Pulse</h3>
        <span className="text-[10px] text-muted ml-auto">Based on {stats.total} sources</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div className="text-center">
          <p className={cn('text-lg font-bold', sentimentColor)}>{sentiment}</p>
          <p className="text-[10px] text-muted">Overall Sentiment</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#00c48c] font-num">{stats.bullPct}%</p>
          <p className="text-[10px] text-muted">Bullish Posts</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#ff4d6a] font-num">{stats.bearPct}%</p>
          <p className="text-[10px] text-muted">Bearish Posts</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground font-num">{stats.breaking}</p>
          <p className="text-[10px] text-muted">Breaking News</p>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="h-2 rounded-full bg-border/30 overflow-hidden flex">
        <div className="bg-[#00c48c] transition-all" style={{ width: `${stats.bullPct}%` }} />
        <div className="bg-border/50 flex-1" />
        <div className="bg-[#ff4d6a] transition-all" style={{ width: `${stats.bearPct}%` }} />
      </div>

      {/* Trending symbols */}
      {stats.trendingSymbols.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[10px] text-muted font-semibold uppercase mr-1">Trending:</span>
          {stats.trendingSymbols.map(([symbol, count]) => (
            <Link key={symbol} to={`/stock/${symbol}`}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors">
              ${symbol} <span className="opacity-50">{count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Community Post Card ───
function CommunityPostCard({ post }: { post: any }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { data: comments } = usePostComments(showComments ? post.id : '');
  const likeMutation = useLikePost();
  const createComment = useCreateComment();

  const initials = (post.author_name || 'A').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{post.author_name}</p>
          <p className="text-[10px] text-muted">{formatDateTime(post.created_at)}</p>
        </div>
        {post.stock_symbol && (
          <Link to={`/stock/${post.stock_symbol}`} className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20">
            ${post.stock_symbol}
          </Link>
        )}
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <button onClick={() => likeMutation.mutate(post.id)}
          className={cn('flex items-center gap-1.5 text-xs transition-colors', post.is_liked ? 'text-[#ff4d6a]' : 'text-muted hover:text-[#ff4d6a]')}>
          <Heart size={14} fill={post.is_liked ? 'currentColor' : 'none'} />
          <span className="font-num">{post.likes_count}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors">
          <MessageCircle size={14} /> <span className="font-num">{post.comments_count}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-border space-y-2.5">
          {(comments || []).map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-surface text-muted flex items-center justify-center text-[9px] font-bold shrink-0">
                {(c.author_name || 'A')[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                <span className="text-[10px] text-muted ml-2">{timeAgo(c.created_at)}</span>
                <p className="text-xs text-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) { createComment.mutate({ post_id: post.id, content: commentText.trim() }, { onSuccess: () => setCommentText('') }); } }}
            />
            <button onClick={() => { if (commentText.trim()) createComment.mutate({ post_id: post.id, content: commentText.trim() }, { onSuccess: () => setCommentText('') }); }}
              disabled={!commentText.trim()} className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-40">
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export function SocialFeedPage() {
  const [tab, setTab] = useState<TabType>('headlines');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const { data: allPosts, isLoading: postsLoading, refetch } = useSocialMediaPosts({ limit: 100 });
  const { data: communityPosts, isLoading: communityLoading } = usePosts();
  const [content, setContent] = useState('');
  const [stockTag, setStockTag] = useState('');
  const createPost = useCreatePost();

  // Filter and sort posts
  const { featured, headlines, analysisPosts } = useMemo(() => {
    const posts = allPosts || [];
    const filtered = categoryFilter === 'all' ? posts : posts.filter(p => p.category === categoryFilter);
    const breaking = filtered.filter(p => p.category === 'breaking' || (p.relevance_score > 0.7 && p.likes_count > 50));
    const analysis = filtered.filter(p => p.category === 'analysis' || p.category === 'opinion');
    return {
      featured: breaking.length > 0 ? breaking : filtered.slice(0, 3),
      headlines: filtered,
      analysisPosts: analysis,
    };
  }, [allPosts, categoryFilter]);

  const handlePost = () => {
    if (!content.trim()) return;
    createPost.mutate(
      { content: content.trim(), stock_symbol: stockTag.trim().toUpperCase() || undefined },
      { onSuccess: () => { setContent(''); setStockTag(''); } }
    );
  };

  const tabs = [
    { key: 'headlines' as TabType, label: 'Headlines', icon: Newspaper, count: headlines.length },
    { key: 'analysis' as TabType, label: 'Analysis & Opinion', icon: BookOpen, count: analysisPosts.length },
    { key: 'community' as TabType, label: 'Community', icon: Users, count: communityPosts?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Globe size={22} className="text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Capital Market Intelligence</h1>
            </div>
            <p className="text-muted text-sm mt-1">DSE & CSE news, analysis, and market sentiment from top sources</p>
          </div>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:text-foreground hover:bg-surface transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Market Pulse Summary */}
        {allPosts && allPosts.length > 0 && <MarketPulse posts={allPosts} />}

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-5 mb-4 border-b border-border overflow-x-auto scrollbar-hide">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                  tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted hover:text-foreground'
                )}>
                <Icon size={15} /> {t.label}
                <span className="text-[10px] opacity-50 font-num ml-0.5">{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* Category Filters (for headlines and analysis tabs) */}
        {tab !== 'community' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(['all', 'breaking', 'market', 'stock', 'analysis', 'ipo', 'regulation', 'opinion'] as CategoryFilter[]).map(f => {
              const cfg = f === 'all' ? { label: 'All', color: 'text-primary', bg: 'bg-primary/10' } : CATEGORY_CONFIG[f];
              return (
                <button key={f} onClick={() => setCategoryFilter(f)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                    categoryFilter === f ? cn(cfg.bg, cfg.color, 'border-transparent') : 'bg-transparent text-muted border-border hover:text-foreground'
                  )}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Headlines Tab ─── */}
        {tab === 'headlines' && (
          postsLoading ? (
            <div className="flex flex-col items-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-muted">Loading market intelligence...</p>
            </div>
          ) : headlines.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted">
              <Newspaper size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No news found</p>
              <p className="text-xs mt-1">Check back after market hours for the latest updates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              {/* Main Feed */}
              <div className="space-y-4">
                {/* Featured Cards */}
                {featured.slice(0, 2).map(post => (
                  <FeaturedNewsCard key={post.id} post={post} />
                ))}

                {/* Rest as compact rows */}
                <div className="rounded-xl border border-border bg-card-solid shadow-[var(--shadow-card)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-2">
                    <Clock size={13} className="text-muted" />
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Latest Updates</span>
                  </div>
                  <div className="px-3 divide-y-0">
                    {headlines.slice(2).map(post => (
                      <NewsRow key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Trending Symbols */}
                <TrendingSidebar posts={allPosts || []} />

                {/* Source info */}
                <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Sources</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    News aggregated from 𝕏 (Twitter), Facebook, Reddit, YouTube, LinkedIn, and DSE/BSEC official channels.
                    Sentiment analysis powered by AI. Updated every hour during market days.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                      <span key={key} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', cfg.bg, cfg.color)}>{cfg.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* ─── Analysis Tab ─── */}
        {tab === 'analysis' && (
          analysisPosts.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted">
              <BookOpen size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No analysis posts available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisPosts.map(post => (
                <FeaturedNewsCard key={post.id} post={post} />
              ))}
            </div>
          )
        )}

        {/* ─── Community Tab ─── */}
        {tab === 'community' && (
          <div>
            {/* Compose */}
            <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)] mb-5">
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your market insights, analysis, or questions..."
                rows={3} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-muted" />
                  <input type="text" value={stockTag} onChange={e => setStockTag(e.target.value)} placeholder="Stock symbol"
                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs w-28 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <Button onClick={handlePost} loading={createPost.isPending} disabled={!content.trim()}>Post</Button>
              </div>
            </div>

            {communityLoading ? (
              <div className="flex flex-col items-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (communityPosts || []).length === 0 ? (
              <div className="flex flex-col items-center py-20 text-muted">
                <Users size={40} className="mb-3 opacity-30" />
                <p className="text-sm">No community posts yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(communityPosts || []).map((post: any) => (
                  <CommunityPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-16 sm:h-4" />
      </div>
    </div>
  );
}

// ─── Trending Sidebar ───
function TrendingSidebar({ posts }: { posts: SocialMediaPost[] }) {
  const symbols = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => (p.symbols || []).forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [posts]);

  if (symbols.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Flame size={13} className="text-orange-500" /> Trending Stocks
      </h4>
      <div className="space-y-2">
        {symbols.map(([symbol, count], i) => (
          <Link key={symbol} to={`/stock/${symbol}`} className="flex items-center justify-between py-1.5 hover:bg-surface rounded px-2 -mx-2 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted font-bold w-4">#{i + 1}</span>
              <span className="text-sm font-semibold text-foreground">{symbol}</span>
            </div>
            <span className="text-xs text-muted font-num">{count} mentions</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
