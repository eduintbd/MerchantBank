import { useState } from 'react';
import { usePosts, useCreatePost, useLikePost, usePostComments, useCreateComment } from '@/hooks/useSocial';
import { useSocialMediaPosts, useTrendingSymbols, type SocialMediaPost } from '@/hooks/useSocialMedia';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import {
  Heart, MessageCircle, Send, Hash, TrendingUp, Users, ExternalLink,
  ThumbsUp, Share2, Eye, CheckCircle, Filter, RefreshCw,
} from 'lucide-react';

// ─── Platform icons & colors ───
const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  twitter:  { label: '𝕏',        color: 'text-foreground', bg: 'bg-black/5' },
  facebook: { label: 'f',        color: 'text-blue-600',   bg: 'bg-blue-50' },
  reddit:   { label: 'r/',       color: 'text-orange-600', bg: 'bg-orange-50' },
  youtube:  { label: '▶',        color: 'text-red-600',    bg: 'bg-red-50' },
  linkedin: { label: 'in',       color: 'text-blue-700',   bg: 'bg-blue-50' },
  news:     { label: '📰',       color: 'text-gray-600',   bg: 'bg-gray-50' },
};

const SENTIMENT_DOT: Record<string, string> = {
  positive: 'bg-success',
  negative: 'bg-danger',
  neutral:  'bg-gray-400',
  mixed:    'bg-amber-400',
};

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'market', label: 'Market' },
  { value: 'stock', label: 'Stock' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'ipo', label: 'IPO' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'breaking', label: 'Breaking' },
  { value: 'opinion', label: 'Opinion' },
];

const PLATFORM_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'twitter', label: '𝕏 Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Trending post card ───
function TrendingPostCard({ post }: { post: SocialMediaPost }) {
  const platform = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.news;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Platform icon */}
        <div className={`w-10 h-10 rounded-full ${platform.bg} ${platform.color} flex items-center justify-center text-sm font-bold shrink-0`}>
          {platform.label}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{post.author_name}</span>
            {post.author_verified && <CheckCircle size={14} className="text-primary shrink-0" />}
            {post.author_handle && (
              <span className="text-xs text-muted truncate">@{post.author_handle.replace('@', '')}</span>
            )}
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">{timeAgo(post.posted_at)}</span>
            {/* Sentiment dot */}
            <span className={`w-2 h-2 rounded-full ${SENTIMENT_DOT[post.sentiment] || SENTIMENT_DOT.neutral}`} title={post.sentiment} />
          </div>

          {/* Content */}
          <p className="text-sm text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap">{post.content}</p>

          {/* Symbol tags */}
          {post.symbols && post.symbols.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.symbols.map(s => (
                <span key={s} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                  ${s}
                </span>
              ))}
            </div>
          )}

          {/* Engagement stats + link */}
          <div className="flex items-center gap-4 mt-2.5 text-xs text-muted">
            {post.likes_count > 0 && (
              <span className="flex items-center gap-1">
                <ThumbsUp size={13} /> <span className="font-num">{post.likes_count.toLocaleString()}</span>
              </span>
            )}
            {post.comments_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle size={13} /> <span className="font-num">{post.comments_count.toLocaleString()}</span>
              </span>
            )}
            {post.shares_count > 0 && (
              <span className="flex items-center gap-1">
                <Share2 size={13} /> <span className="font-num">{post.shares_count.toLocaleString()}</span>
              </span>
            )}
            {post.views_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={13} /> <span className="font-num">{post.views_count.toLocaleString()}</span>
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 capitalize">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                post.category === 'breaking' ? 'bg-danger/10 text-danger' :
                post.category === 'market' ? 'bg-primary/10 text-primary' :
                post.category === 'analysis' ? 'bg-purple-100 text-purple-700' :
                'bg-black/5 text-muted'
              }`}>
                {post.category}
              </span>
            </span>
            {post.post_url && (
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Community post card (existing) ───
function PostCard({ post }: { post: any }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { data: comments } = usePostComments(showComments ? post.id : '');
  const likeMutation = useLikePost();
  const createComment = useCreateComment();

  const handleLike = () => likeMutation.mutate(post.id);
  const handleComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate({ post_id: post.id, content: commentText.trim() }, {
      onSuccess: () => setCommentText(''),
    });
  };

  const initials = (post.author_name || 'A')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{post.author_name}</p>
          <p className="text-xs text-muted">{formatDateTime(post.created_at)}</p>
        </div>
        {post.stock_symbol && <Badge status="info" label={post.stock_symbol} />}
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="rounded-lg w-full max-h-80 object-cover" />
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.is_liked ? 'text-danger' : 'text-muted hover:text-danger'
          }`}
        >
          <Heart size={16} fill={post.is_liked ? 'currentColor' : 'none'} />
          <span className="font-num">{post.likes_count}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-info transition-colors"
        >
          <MessageCircle size={16} />
          <span className="font-num">{post.comments_count}</span>
        </button>
      </div>

      {showComments && (
        <div className="space-y-3 pt-2">
          {(comments || []).map((comment: any) => (
            <div key={comment.id} className="flex gap-2 pl-2">
              <div className="w-7 h-7 rounded-full bg-black/5 text-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                {(comment.author_name || 'A')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs">
                  <span className="font-semibold text-foreground">{comment.author_name}</span>
                  <span className="text-muted ml-2">{formatDateTime(comment.created_at)}</span>
                </p>
                <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button
              size="sm"
              onClick={handleComment}
              loading={createComment.isPending}
              disabled={!commentText.trim()}
              icon={<Send size={14} />}
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Trending Symbols sidebar ───
function TrendingSymbols() {
  const { data: symbols } = useTrendingSymbols();

  if (!symbols || symbols.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrendingUp size={16} className="text-primary" />
        Trending Symbols
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {symbols.map(({ symbol, count }) => (
          <span
            key={symbol}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
          >
            ${symbol}
            <span className="text-[10px] text-primary/60 font-num">{count}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─── Main page ───
export function SocialFeedPage() {
  const [tab, setTab] = useState<'trending' | 'community'>('trending');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Trending posts
  const { data: trendingPosts, isLoading: trendingLoading, refetch: refetchTrending } = useSocialMediaPosts({
    platform: platformFilter,
    category: categoryFilter,
  });

  // Community posts
  const [content, setContent] = useState('');
  const [stockTag, setStockTag] = useState('');
  const { data: posts, isLoading: postsLoading } = usePosts();
  const createPost = useCreatePost();

  const handlePost = () => {
    if (!content.trim()) return;
    createPost.mutate(
      { content: content.trim(), stock_symbol: stockTag.trim().toUpperCase() || undefined },
      { onSuccess: () => { setContent(''); setStockTag(''); } }
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Social Feed</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Trending stock market buzz & community discussions</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('trending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'trending'
              ? 'bg-white shadow-sm text-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <TrendingUp size={16} />
          Trending
        </button>
        <button
          onClick={() => setTab('community')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'community'
              ? 'bg-white shadow-sm text-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Users size={16} />
          Community
        </button>
      </div>

      {/* ─── TRENDING TAB ─── */}
      {tab === 'trending' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Filter size={14} />
                Platform:
              </div>
              <div className="flex flex-wrap gap-1">
                {PLATFORM_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setPlatformFilter(f.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      platformFilter === f.value
                        ? 'bg-primary text-white'
                        : 'bg-surface text-muted hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block w-px h-5 bg-border" />
              <div className="flex flex-wrap gap-1">
                {CATEGORY_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setCategoryFilter(f.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      categoryFilter === f.value
                        ? 'bg-primary text-white'
                        : 'bg-surface text-muted hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => refetchTrending()}
                className="ml-auto p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Post list */}
            {trendingLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted mt-3">Loading trending posts...</p>
              </div>
            ) : (trendingPosts || []).length === 0 ? (
              <Card className="text-center py-12">
                <TrendingUp size={40} className="text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">No trending posts found.</p>
                <p className="text-xs text-muted mt-1">Posts are scanned every hour from social media platforms.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {(trendingPosts || []).map(post => (
                  <TrendingPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            <TrendingSymbols />
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-2">About Trending</h3>
              <p className="text-xs text-muted leading-relaxed">
                Posts are automatically aggregated every hour from Twitter/X, Facebook, Reddit, YouTube, and LinkedIn.
                Only posts related to DSE and Bangladesh stock market are shown, ranked by relevance and engagement.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ─── COMMUNITY TAB ─── */}
      {tab === 'community' && (
        <div>
          {/* Compose box */}
          <Card className="mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your stock insights..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-muted" />
                <input
                  type="text"
                  value={stockTag}
                  onChange={(e) => setStockTag(e.target.value)}
                  placeholder="Stock symbol (optional)"
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs w-36 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button onClick={handlePost} loading={createPost.isPending} disabled={!content.trim()}>
                Post
              </Button>
            </div>
          </Card>

          {/* Community feed */}
          {postsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted mt-3">Loading posts...</p>
            </div>
          ) : (posts || []).length === 0 ? (
            <Card className="text-center py-12">
              <MessageCircle size={40} className="text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">No posts yet. Be the first to share!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {(posts || []).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
