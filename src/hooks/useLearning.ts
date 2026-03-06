import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Course, Lesson, Quiz } from '@/types';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .order('order');
      if (error) throw error;

      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      const completedLessons = new Set((progress || []).map(p => p.lesson_id));

      return (courses || []).map(c => ({
        ...c,
        completed_lessons: (c.lesson_ids || []).filter((id: string) => completedLessons.has(id)).length,
      }));
    },
  });
}

export function useLessons(courseId: string) {
  return useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async (): Promise<Lesson[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order');
      if (error) throw error;

      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id);

      const progressMap = new Map((progress || []).map(p => [p.lesson_id, p.completed]));

      return (data || []).map((lesson, index) => ({
        ...lesson,
        status: progressMap.get(lesson.id)
          ? 'completed' as const
          : index === 0 || progressMap.get(data![index - 1]?.id)
            ? 'available' as const
            : 'locked' as const,
      }));
    },
    enabled: !!courseId,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

export function useQuiz(courseId: string) {
  return useQuery({
    queryKey: ['quiz', courseId],
    queryFn: async (): Promise<Quiz | null> => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!courseId,
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: string; answers: Record<string, number> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: quizId,
        answers,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useLearningProgress() {
  return useQuery({
    queryKey: ['learning-progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: courses } = await supabase.from('courses').select('id, total_lessons, is_required');
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true);

      const totalRequired = (courses || []).filter(c => c.is_required).reduce((sum, c) => sum + c.total_lessons, 0);
      const completedCount = (progress || []).length;
      const isQualified = totalRequired > 0 && completedCount >= totalRequired;

      return {
        totalCourses: (courses || []).length,
        completedLessons: completedCount,
        totalLessons: (courses || []).reduce((sum, c) => sum + c.total_lessons, 0),
        progressPercent: totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0,
        isQualified,
      };
    },
  });
}
