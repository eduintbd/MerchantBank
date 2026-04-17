import { useState, useMemo } from 'react';
import { usePosts, useCreatePost, useLikePost, usePostComments, useCreateComment } from '@/hooks/useSocial';
import { useSocialMediaPosts, type SocialMediaPost } from '@/hooks/useSocialMedia';
import { Button } from '@/components/ui/Button';
import { formatDateTime, cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Send, Hash, TrendingUp, Users, ExternalLink,
  ThumbsUp, Share2, Eye, CheckCircle, RefreshCw, Newspaper,
  BarChart2, AlertTriangle, Flame, Globe, Clock,
  ArrowUpRight, Zap, Radio, Linkedin, Facebook,
} from 'lucide-react';

// ─── Platform Configs ───
const PLATFORM_META: Record<string, {
  label: string; icon: any; color: string; bg: string; border: string; gradient: string;
}> = {
  facebook: {
    label: 'Facebook', icon: Facebook, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/5',
    border: 'border-[#1877F2]/20', gradient: 'from-[#1877F2] to-[#42A5F5]',
  },
  linkedin: {
    label: 'LinkedIn', icon: Linkedin, color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/5',
    border: 'border-[#0A66C2]/20', gradient: 'from-[#0A66C2] to-[#2196F3]',
  },
  twitter: {
    label: '𝕏', icon: Globe, color: 'text-foreground', bg: 'bg-black/5',
    border: 'border-black/10', gradient: 'from-gray-800 to-gray-600',
  },
  reddit: {
    label: 'Reddit', icon: Globe, color: 'text-[#FF4500]', bg: 'bg-[#FF4500]/5',
    border: 'border-[#FF4500]/20', gradient: 'from-[#FF4500] to-[#FF7043]',
  },
  youtube: {
    label: 'YouTube', icon: Globe, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/5',
    border: 'border-[#FF0000]/20', gradient: 'from-[#FF0000] to-[#FF5252]',
  },
  news: {
    label: 'News', icon: Newspaper, color: 'text-emerald-600', bg: 'bg-emerald-50',
    border: 'border-emerald-200', gradient: 'from-emerald-600 to-emerald-400',
  },
};

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  positive: { label: 'Bullish', color: 'text-[#00c48c]', bg: 'bg-[#00c48c]/10', icon: TrendingUp },
  negative: { label: 'Bearish', color: 'text-[#ff4d6a]', bg: 'bg-[#ff4d6a]/10', icon: AlertTriangle },
  neutral:  { label: 'Neutral', color: 'text-muted', bg: 'bg-surface', icon: BarChart2 },
  mixed:    { label: 'Mixed', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Zap },
};

type TabType = 'all' | 'news' | 'social' | 'community';
type PlatformFilter = 'all' | 'news' | 'facebook' | 'linkedin' | 'twitter' | 'reddit' | 'youtube';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1d';
  return `${days}d`;
}

// ─── Social Card (Facebook / LinkedIn style) ───
function SocialCard({ post }: { post: SocialMediaPost }) {
  const platform = PLATFORM_META[post.platform] || PLATFORM_META.news;
  const sentiment = SENTIMENT_CONFIG[post.sentiment] || SENTIMENT_CONFIG.neutral;
  const SentimentIcon = sentiment.icon;
  const PlatformIcon = platform.icon;

  const isFacebook = post.platform === 'facebook';
  const isLinkedin = post.platform === 'linkedin';
  const isSocial = isFacebook || isLinkedin;

  return (
    <div className={cn(
      'rounded-2xl border bg-card-solid overflow-hidden transition-all duration-200',
      'hover:shadow-lg hover:-translate-y-0.5',
      platform.border,
    )}>
      {/* Platform accent bar */}
      <div className={cn('h-1 bg-gradient-to-r', platform.gradient)} />

      <div className="p-5">
        {/* Header: Author + Platform + Time */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
            isSocial ? cn('bg-gradient-to-br', platform.gradient, 'text-white') : cn(platform.bg, platform.color),
          )}>
            {isSocial ? (
              <PlatformIcon size={20} />
            ) : (
              <span className="text-sm font-bold">{post.author_name[0]}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground truncate">{post.author_name}</span>
              {post.author_verified && <CheckCircle size={14} className="text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-[11px] font-semibold', platform.color)}>{platform.label}</span>
              <span className="text-[10px] text-muted/50">|</span>
              <span className="text-[11px] text-muted flex items-center gap-1">
                <Clock size={10} /> {timeAgo(post.posted_at)}
              </span>
            </div>
          </div>

          <span className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0',
            sentiment.bg, sentiment.color,
          )}>
            <SentimentIcon size={10} /> {sentiment.label}
          </span>
        </div>

        {/* Content */}
        <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Stock Tags */}
        {post.symbols && post.symbols.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.symbols.map(s => (
              <Link key={s} to={`/stock/${s}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold hover:bg-primary/15 transition-colors">
                <ArrowUpRight size={11} />${s}
              </Link>
            ))}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border/50">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <ThumbsUp size={14} /> <span className="font-semibold">{post.likes_count.toLocaleString()}</span>
            </span>
          )}
          {post.comments_count > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <MessageCircle size={14} /> <span className="font-semibold">{post.comments_count.toLocaleString()}</span>
            </span>
          )}
          {post.shares_count > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Share2 size={14} /> <span className="font-semibold">{post.shares_count.toLocaleString()}</span>
            </span>
          )}
          {post.views_count > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Eye size={14} /> <span className="font-semibold">{post.views_count.toLocaleString()}</span>
            </span>
          )}
          {post.post_url && (
            <a href={post.post_url} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/70 transition-colors">
              Open <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── News Headline Card ───
function NewsCard({ post }: { post: SocialMediaPost }) {
  const sentiment = SENTIMENT_CONFIG[post.sentiment] || SENTIMENT_CONFIG.neutral;
  const SentimentIcon = sentiment.icon;

  return (
    <div className="group flex gap-4 p-4 rounded-xl border border-border/50 bg-card-solid hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Sentiment indicator */}
      <div className={cn(
        'w-1.5 rounded-full shrink-0 self-stretch',
        post.sentiment === 'positive' ? 'bg-[#00c48c]' :
        post.sentiment === 'negative' ? 'bg-[#ff4d6a]' :
        post.sentiment === 'mixed' ? 'bg-amber-400' : 'bg-border',
      )} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.content}
        </p>

        <div className="flex items-center gap-3 mt-2.5">
          <span className="text-[11px] font-bold text-muted">{post.author_name}</span>
          <span className="text-[10px] text-muted flex items-center gap-1">
            <Clock size={9} /> {timeAgo(post.posted_at)}
          </span>
          <span className={cn('flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full', sentiment.bg, sentiment.color)}>
            <SentimentIcon size={9} /> {sentiment.label}
          </span>

          {post.symbols && post.symbols.length > 0 && (
            <div className="flex gap-1 ml-auto">
              {post.symbols.slice(0, 2).map(s => (
                <Link key={s} to={`/stock/${s}`} className="text-[10px] font-bold text-primary hover:underline">${s}</Link>
              ))}
            </div>
          )}

          {post.post_url && (
            <a href={post.post_url} target="_blank" rel="noopener noreferrer"
              className="ml-auto text-muted hover:text-primary transition-colors">
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Market Pulse ───
function MarketPulse({ posts }: { posts: SocialMediaPost[] }) {
  const stats = useMemo(() => {
    const total = posts.length;
    const positive = posts.filter(p => p.sentiment === 'positive').length;
    const negative = posts.filter(p => p.sentiment === 'negative').length;
    const bullPct = total > 0 ? Math.round((positive / total) * 100) : 50;
    const bearPct = total > 0 ? Math.round((negative / total) * 100) : 50;
    const breaking = posts.filter(p => p.category === 'breaking').length;
    const platforms = new Set(posts.map(p => p.platform)).size;
    return { total, bullPct, bearPct, breaking, platforms };
  }, [posts]);

  const sentiment = stats.bullPct >= 60 ? 'Bullish' : stats.bearPct >= 60 ? 'Bearish' : 'Neutral';
  const sentimentColor = sentiment === 'Bullish' ? 'text-[#00c48c]' : sentiment === 'Bearish' ? 'text-[#ff4d6a]' : 'text-muted';

  return (
    <div className="rounded-2xl border border-border bg-card-solid p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Radio size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Market Pulse</h3>
          <p className="text-[10px] text-muted">{stats.total} posts from {stats.platforms} sources</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-xl bg-surface/50">
          <p className={cn('text-xl font-black', sentimentColor)}>{sentiment}</p>
          <p className="text-[10px] text-muted mt-0.5">Sentiment</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#00c48c]/5">
          <p className="text-xl font-black text-[#00c48c]">{stats.bullPct}%</p>
          <p className="text-[10px] text-muted mt-0.5">Bullish</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#ff4d6a]/5">
          <p className="text-xl font-black text-[#ff4d6a]">{stats.bearPct}%</p>
          <p className="text-[10px] text-muted mt-0.5">Bearish</p>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="h-2.5 rounded-full bg-border/20 overflow-hidden flex">
        <div className="bg-gradient-to-r from-[#00c48c] to-[#00e6a0] rounded-full transition-all" style={{ width: `${stats.bullPct}%` }} />
        <div className="flex-1" />
        <div className="bg-gradient-to-r from-[#ff7090] to-[#ff4d6a] rounded-full transition-all" style={{ width: `${stats.bearPct}%` }} />
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
    <div className="rounded-2xl border border-border bg-card-solid p-5 shadow-sm">
      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <Flame size={16} className="text-orange-500" /> Trending
      </h4>
      <div className="space-y-1">
        {symbols.map(([symbol, count], i) => (
          <Link key={symbol} to={`/stock/${symbol}`}
            className="flex items-center justify-between py-2.5 px-3 -mx-1 rounded-xl hover:bg-surface transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-black w-5 text-right">{i + 1}</span>
              <span className="text-sm font-bold text-foreground">{symbol}</span>
            </div>
            <span className="text-[11px] text-muted font-semibold">{count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Platform Filter Pills ───
function PlatformFilters({ active, onChange }: { active: PlatformFilter; onChange: (f: PlatformFilter) => void }) {
  const filters: { key: PlatformFilter; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Globe },
    { key: 'news', label: 'News', icon: Newspaper },
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'twitter', label: '𝕏', icon: Globe },
    { key: 'reddit', label: 'Reddit', icon: Globe },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {filters.map(f => {
        const Icon = f.icon;
        const isActive = active === f.key;
        return (
          <button key={f.key} onClick={() => onChange(f.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-muted hover:text-foreground hover:bg-surface/80',
            )}>
            <Icon size={13} /> {f.label}
          </button>
        );
      })}
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
    <div className="rounded-2xl border border-border bg-card-solid overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{post.author_name}</p>
            <p className="text-[11px] text-muted">{formatDateTime(post.created_at)}</p>
          </div>
          {post.stock_symbol && (
            <Link to={`/stock/${post.stock_symbol}`}
              className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">
              ${post.stock_symbol}
            </Link>
          )}
        </div>

        <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-border/50">
        <button onClick={() => likeMutation.mutate(post.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors',
            post.is_liked ? 'text-[#ff4d6a]' : 'text-muted hover:text-[#ff4d6a] hover:bg-[#ff4d6a]/5',
          )}>
          <Heart size={16} fill={post.is_liked ? 'currentColor' : 'none'} />
          {post.likes_count > 0 ? post.likes_count : 'Like'}
        </button>
        <div className="w-px h-8 bg-border/50" />
        <button onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-muted hover:text-primary hover:bg-primary/5 transition-colors">
          <MessageCircle size={16} />
          {post.comments_count > 0 ? post.comments_count : 'Comment'}
        </button>
      </div>

      {showComments && (
        <div className="px-5 pb-4 pt-2 border-t border-border/30 space-y-3">
          {(comments || []).map((c: any) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-surface text-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                {(c.author_name || 'A')[0].toUpperCase()}
              </div>
              <div className="bg-surface rounded-xl px-3 py-2 flex-1">
                <span className="text-xs font-bold text-foreground">{c.author_name}</span>
                <span className="text-[10px] text-muted ml-2">{timeAgo(c.created_at)}</span>
                <p className="text-xs text-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={e => {
                if (e.key === 'Enter' && commentText.trim()) {
                  createComment.mutate({ post_id: post.id, content: commentText.trim() }, { onSuccess: () => setCommentText('') });
                }
              }}
            />
            <button onClick={() => {
              if (commentText.trim()) createComment.mutate({ post_id: post.id, content: commentText.trim() }, { onSuccess: () => setCommentText('') });
            }}
              disabled={!commentText.trim()}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export function SocialFeedPage() {
  const [tab, setTab] = useState<TabType>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');

  const { data: allPosts, isLoading: postsLoading, refetch } = useSocialMediaPosts({ limit: 100, daysBack: 3 });
  const { data: communityPosts, isLoading: communityLoading } = usePosts();
  const [content, setContent] = useState('');
  const [stockTag, setStockTag] = useState('');
  const createPost = useCreatePost();

  // Filter posts
  const filteredPosts = useMemo(() => {
    const posts = allPosts || [];
    if (tab === 'news') return posts.filter(p => p.platform === 'news');
    if (tab === 'social') return posts.filter(p => p.platform !== 'news');
    if (platformFilter !== 'all') return posts.filter(p => p.platform === platformFilter);
    return posts;
  }, [allPosts, tab, platformFilter]);

  const handlePost = () => {
    if (!content.trim()) return;
    createPost.mutate(
      { content: content.trim(), stock_symbol: stockTag.trim().toUpperCase() || undefined },
      { onSuccess: () => { setContent(''); setStockTag(''); } }
    );
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'all', label: 'All Feed', icon: Globe },
    { key: 'news', label: 'News', icon: Newspaper },
    { key: 'social', label: 'Social', icon: Share2 },
    { key: 'community', label: 'Community', icon: Users },
  ];

  const lastUpdated = allPosts && allPosts.length > 0
    ? timeAgo(allPosts[0].posted_at)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div style={{ maxWidth: 1280, margin: '0 auto' }} className="px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Market Intelligence</h1>
            <p className="text-sm text-muted mt-1 flex items-center gap-2">
              Live news & social updates from DSE, CSE, and capital markets
              {lastUpdated && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-[#00c48c]/10 text-[#00c48c] px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c] animate-pulse" />
                  {lastUpdated}
                </span>
              )}
            </p>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted hover:text-foreground hover:bg-surface transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface rounded-xl mb-5 w-fit">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all',
                  tab === t.key
                    ? 'bg-card-solid text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground',
                )}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === 'community' ? (
          /* ─── Community Tab ─── */
          <div className="max-w-2xl mx-auto">
            {/* Compose */}
            <div className="rounded-2xl border border-border bg-card-solid p-5 shadow-sm mb-5">
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Share your market insights..."
                rows={3}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-muted" />
                  <input type="text" value={stockTag} onChange={e => setStockTag(e.target.value)}
                    placeholder="Stock symbol"
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs w-28 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <Button onClick={handlePost} loading={createPost.isPending} disabled={!content.trim()}>Post</Button>
              </div>
            </div>

            {communityLoading ? (
              <LoadingState />
            ) : (communityPosts || []).length === 0 ? (
              <EmptyState icon={Users} message="No community posts yet" sub="Be the first to share your insights" />
            ) : (
              <div className="space-y-4">
                {(communityPosts || []).map((post: any) => (
                  <CommunityPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ─── Feed Tabs (All / News / Social) ─── */
          <>
            {/* Platform filter pills */}
            {tab === 'all' && (
              <div className="mb-5">
                <PlatformFilters active={platformFilter} onChange={setPlatformFilter} />
              </div>
            )}

            {postsLoading ? (
              <LoadingState />
            ) : filteredPosts.length === 0 ? (
              <EmptyState icon={Newspaper} message="No recent updates" sub="Check back soon for the latest market news" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* Main Feed */}
                <div className="space-y-4">
                  {/* Market Pulse */}
                  {allPosts && allPosts.length > 0 && tab === 'all' && (
                    <MarketPulse posts={allPosts} />
                  )}

                  {/* Posts */}
                  {filteredPosts.map(post => (
                    post.platform === 'news' ? (
                      <NewsCard key={post.id} post={post} />
                    ) : (
                      <SocialCard key={post.id} post={post} />
                    )
                  ))}
                </div>

                {/* Sidebar */}
                <div className="space-y-4 hidden lg:block">
                  <TrendingSidebar posts={allPosts || []} />

                  {/* Sources card */}
                  <div className="rounded-2xl border border-border bg-card-solid p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-foreground mb-3">Sources</h4>
                    <p className="text-xs text-muted leading-relaxed mb-3">
                      Aggregated from news outlets, social platforms, and official channels. Updated every 5 minutes.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PLATFORM_META).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <span key={key} className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
                            <Icon size={11} /> {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="h-16 sm:h-4" />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center py-20">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted font-medium">Loading latest updates...</p>
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-24 text-muted">
      <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
        <Icon size={28} className="opacity-30" />
      </div>
      <p className="text-sm font-bold">{message}</p>
      <p className="text-xs mt-1 opacity-70">{sub}</p>
    </div>
  );
}
