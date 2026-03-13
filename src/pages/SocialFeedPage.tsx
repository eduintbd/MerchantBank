import { useState } from 'react';
import { usePosts, useCreatePost, useLikePost, usePostComments, useCreateComment } from '@/hooks/useSocial';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { Heart, MessageCircle, Send, Hash } from 'lucide-react';

function PostCard({ post }: { post: any }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { data: comments } = usePostComments(showComments ? post.id : '');
  const likeMutation = useLikePost();
  const createComment = useCreateComment();

  const handleLike = () => {
    likeMutation.mutate(post.id);
  };

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
      {/* Author header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{post.author_name}</p>
          <p className="text-xs text-muted">{formatDateTime(post.created_at)}</p>
        </div>
        {post.stock_symbol && (
          <Badge status="info" label={post.stock_symbol} />
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="rounded-lg w-full max-h-80 object-cover" />
      )}

      {/* Actions */}
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

      {/* Comments section */}
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

          {/* Add comment */}
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

export function SocialFeedPage() {
  const [content, setContent] = useState('');
  const [stockTag, setStockTag] = useState('');
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();

  const handlePost = () => {
    if (!content.trim()) return;
    createPost.mutate(
      { content: content.trim(), stock_symbol: stockTag.trim().toUpperCase() || undefined },
      { onSuccess: () => { setContent(''); setStockTag(''); } }
    );
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Discuss stocks with fellow investors</p>
      </div>

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

      {/* Feed */}
      {isLoading ? (
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
      )}      </div>

    </div>
  );
}