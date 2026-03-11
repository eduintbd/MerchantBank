import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types inline (will be in types/index.ts later)
interface Post {
  id: string;
  user_id: string;
  stock_symbol?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  is_liked?: boolean;
}

interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export function usePosts(stockSymbol?: string) {
  return useQuery({
    queryKey: ['posts', stockSymbol],
    queryFn: async (): Promise<Post[]> => {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (stockSymbol) {
        query = query.eq('stock_symbol', stockSymbol);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check which posts current user has liked
      let likedPostIds = new Set<string>();
      if (user && data && data.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', data.map((p: any) => p.id));
        likedPostIds = new Set((likes || []).map((l: any) => l.post_id));
      }

      return (data || []).map((p: any): Post => ({
        id: p.id,
        user_id: p.user_id,
        stock_symbol: p.stock_symbol,
        content: p.content,
        image_url: p.image_url,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        created_at: p.created_at,
        author_name: p.profiles?.full_name || 'Anonymous',
        author_avatar: p.profiles?.avatar_url,
        is_liked: likedPostIds.has(p.id),
      }));
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: { content: string; stock_symbol?: string; image_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: post.content,
          stock_symbol: post.stock_symbol || null,
          image_url: post.image_url || null,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async (): Promise<PostComment[]> => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, profiles!post_comments_user_id_fkey(full_name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((c: any): PostComment => ({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        author_name: c.profiles?.full_name || 'Anonymous',
      }));
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: { post_id: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: comment.post_id,
          user_id: user.id,
          content: comment.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try to insert; if conflict (already liked), delete instead
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });

      if (insertError) {
        // Conflict means already liked — remove the like
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        return { action: 'unliked' };
      }

      return { action: 'liked' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
