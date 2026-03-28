import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface NewsComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export function useNewsComments(postId: string) {
  return useQuery({
    queryKey: ['news-comments', postId],
    queryFn: async (): Promise<NewsComment[]> => {
      const { data, error } = await supabase
        .from('news_comments')
        .select('*, profiles!news_comments_user_id_fkey(full_name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((c: any): NewsComment => ({
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

export function useCreateNewsComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: { post_id: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to comment');

      const { data, error } = await supabase
        .from('news_comments')
        .insert({ post_id: comment.post_id, user_id: user.id, content: comment.content })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['news-comments', variables.post_id] });
    },
  });
}
