import { useState } from 'react';
import { useCourses, useLessons, useCompleteLesson, useLearningProgress } from '@/hooks/useLearning';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { GraduationCap, BookOpen, CheckCircle, Lock, PlayCircle, ArrowLeft, Award } from 'lucide-react';

export function LearningPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const { data: courses, isLoading } = useCourses();
  const { data: lessons } = useLessons(selectedCourse || '');
  const { data: progress } = useLearningProgress();
  const completeLesson = useCompleteLesson();

  const currentLesson = lessons?.find(l => l.id === selectedLesson);

  // Lesson detail view
  if (selectedLesson && currentLesson) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to lessons
        </button>
        <Card>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">{currentLesson.title}</h1>
          <p className="text-sm text-muted mb-6">{currentLesson.duration_minutes} min read</p>
          <div className="text-sm leading-relaxed text-muted whitespace-pre-wrap">{currentLesson.content}</div>
          {currentLesson.status !== 'completed' && (
            <div className="mt-8 pt-5 border-t border-border flex justify-end">
              <Button onClick={() => completeLesson.mutate(currentLesson.id)} loading={completeLesson.isPending} icon={<CheckCircle size={16} />}>
                Mark as Complete
              </Button>
            </div>
          )}
        </Card>
      </div>
      </div>
    );
  }

  // Lessons list view
  if (selectedCourse) {
    const course = courses?.find(c => c.id === selectedCourse);
    return (
      <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to courses
        </button>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">{course?.title}</h1>
          <p className="text-muted text-sm sm:text-base mt-1">{course?.description}</p>
        </div>
        <div className="space-y-3">
          {lessons?.map((lesson, index) => (
            <Card
              key={lesson.id}
              hover={lesson.status !== 'locked'}
              className={cn(lesson.status === 'locked' && 'opacity-50 cursor-not-allowed')}
              onClick={() => lesson.status !== 'locked' && setSelectedLesson(lesson.id)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                  lesson.status === 'completed' ? 'bg-success/15 text-success' :
                  lesson.status === 'locked' ? 'bg-gray-100 text-muted' :
                  'bg-info/15 text-info'
                )}>
                  {lesson.status === 'completed' ? <CheckCircle size={20} /> :
                   lesson.status === 'locked' ? <Lock size={20} /> :
                   <PlayCircle size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base">Lesson {index + 1}: {lesson.title}</h3>
                  <p className="text-xs sm:text-sm text-muted mt-0.5">{lesson.duration_minutes} minutes</p>
                </div>
                <Badge status={lesson.status} />
              </div>
            </Card>
          )) || (
            <Card className="text-center py-12">
              <BookOpen size={32} className="mx-auto mb-3 text-muted" />
              <p className="text-sm text-muted">No lessons available</p>
            </Card>
          )}
        </div>
      </div>
      </div>
    );
  }

  // Courses grid view
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Learning Center</h1>
          <p className="text-muted text-sm sm:text-base mt-1">Complete the courses to qualify for trading</p>
        </div>
        {progress?.isQualified && (
          <div className="flex items-center gap-2 bg-success/10 text-success border border-success/20 px-4 py-2.5 rounded-xl">
            <Award size={18} />
            <span className="text-sm font-medium">Qualified to Trade</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {progress && (
        <Card className="grad-info mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium">Overall Progress</span>
            <span className="text-sm text-muted font-num">{progress.completedLessons}/{progress.totalLessons} lessons</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-info h-2.5 rounded-full transition-all" style={{ width: `${progress.progressPercent}%` }} />
          </div>
          <p className="text-sm text-muted mt-3">
            {progress.isQualified ? 'All required courses completed. You are qualified to trade.' : 'Complete all required courses to unlock trading.'}
          </p>
        </Card>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="skeleton h-5 w-3/4 mb-4" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-2/3 mb-5" />
              <div className="skeleton h-2 w-full" />
            </div>
          ))
        ) : courses?.length === 0 ? (
          <Card className="col-span-full text-center py-12">
            <GraduationCap size={32} className="mx-auto mb-3 text-muted" />
            <p className="text-sm text-muted">No courses available yet</p>
          </Card>
        ) : (
          courses?.map(course => {
            const pct = course.total_lessons > 0 ? (course.completed_lessons / course.total_lessons) * 100 : 0;
            return (
              <Card key={course.id} hover onClick={() => setSelectedCourse(course.id)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-info/15">
                    <BookOpen size={20} className="text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{course.title}</h3>
                    {course.is_required && (
                      <span className="text-[10px] text-danger font-semibold uppercase tracking-wider">Required</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-sm mb-2.5">
                  <span className="text-muted">{course.total_lessons} lessons</span>
                  <span className="font-medium font-num">{course.completed_lessons}/{course.total_lessons}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={cn('h-2 rounded-full transition-all', pct === 100 ? 'bg-success' : 'bg-info')} style={{ width: `${pct}%` }} />
                </div>
              </Card>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
