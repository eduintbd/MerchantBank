import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ACADEMY_COURSES, getAcademyProgress, completeAcademyLesson, getAcademyStats,
  type AcademyCourse, type AcademyLesson, type AcademyProgress,
} from '@/data/academy';
import { trackEvent } from '@/services/visitorTracker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  GraduationCap, BookOpen, CheckCircle, Lock, PlayCircle, ArrowLeft, Award, ChevronRight,
  Moon, Users, BarChart3, ShieldCheck, Zap, Trophy, Wallet, PieChart, Bell, Rocket, Activity,
} from 'lucide-react';

const moreItems = [
  { to: '/halal', icon: Moon, label: 'Halal Stocks', desc: 'Shariah-compliant investments', color: 'text-success', bg: 'bg-success/10' },
  { to: '/women-investors', icon: Users, label: 'Women Investors', desc: 'Empowering women in finance', color: 'text-purple', bg: 'bg-purple/10' },
  { to: '/market-history', icon: BarChart3, label: 'Market History', desc: 'DSEX historical data & charts', color: 'text-info', bg: 'bg-info/10' },
  { to: '/ipo', icon: Rocket, label: 'IPO Center', desc: 'Upcoming & open IPOs', color: 'text-warning', bg: 'bg-warning/10' },
  { to: '/social', icon: Activity, label: 'Social Feed', desc: 'Discuss stocks with investors', color: 'text-info', bg: 'bg-info/10' },
  { to: '/bsec-rules', icon: ShieldCheck, label: 'BSEC Rules', desc: 'Regulations & compliance', color: 'text-danger', bg: 'bg-danger/10' },
  { to: '/trader-bios', icon: BookOpen, label: 'Trader Bios', desc: 'Legendary investor profiles', color: 'text-gold', bg: 'bg-warning/10' },
  { to: '/investor-journey', icon: Zap, label: 'Investor Journey', desc: 'Gamified learning journey', color: 'text-warning', bg: 'bg-warning/10' },
  { to: '/investors', icon: Trophy, label: 'Top Investors', desc: 'Leaderboard & profiles', color: 'text-success', bg: 'bg-success/10' },
  { to: '/finance', icon: Wallet, label: 'Finance Tracker', desc: 'Track income & expenses', color: 'text-info', bg: 'bg-info/10' },
  { to: '/portfolio/analysis', icon: PieChart, label: 'Portfolio Analysis', desc: 'Risk & diversification tools', color: 'text-purple', bg: 'bg-purple/10' },
  { to: '/notifications/settings', icon: Bell, label: 'Notifications', desc: 'Alert preferences', color: 'text-muted', bg: 'bg-black/5' },
  { to: '/stock/GP', icon: Activity, label: 'Stock Detail', desc: 'Detailed stock analysis', color: 'text-foreground', bg: 'bg-black/5' },
];

export function LearningPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [progress, setProgress] = useState<AcademyProgress>(getAcademyProgress);

  const stats = getAcademyStats(progress);
  const course = selectedCourse ? ACADEMY_COURSES.find(c => c.id === selectedCourse) : null;
  const lesson = selectedLesson && course ? course.lessons.find(l => l.id === selectedLesson) : null;

  const handleComplete = useCallback((lessonId: string) => {
    const updated = completeAcademyLesson(lessonId);
    setProgress(updated);
    trackEvent('lesson_completed', lessonId);
  }, []);

  function getLessonStatus(lessonId: string, courseObj: AcademyCourse, lessonIndex: number): string {
    if (progress.completedLessons.includes(lessonId)) return 'completed';
    if (lessonIndex === 0) return 'available';
    const prevLesson = courseObj.lessons[lessonIndex - 1];
    if (prevLesson && progress.completedLessons.includes(prevLesson.id)) return 'available';
    return 'locked';
  }

  // ─── Lesson Detail View ───
  if (selectedLesson && lesson && course) {
    const lessonIndex = course.lessons.findIndex(l => l.id === selectedLesson);
    const isCompleted = progress.completedLessons.includes(lesson.id);
    const nextLesson = course.lessons[lessonIndex + 1] || null;
    const nextLessonAvailable = nextLesson && (isCompleted || progress.completedLessons.includes(nextLesson.id));

    return (
      <div className="min-h-screen bg-white animate-fade-in">
        <div style={{ maxWidth: 800, margin: '0 auto' }} className="px-3 sm:px-6 py-4 sm:py-6">
          <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft size={16} /> Back to {course.title}
          </button>

          {/* Lesson header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <span>{course.icon} {course.title}</span>
              <ChevronRight size={12} />
              <span>Lesson {lessonIndex + 1} of {course.lessons.length}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{lesson.duration} min read</span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle size={12} /> Completed
                </span>
              )}
            </div>
          </div>

          {/* Lesson content — rendered as markdown-like */}
          <article className="prose-custom">
            {lesson.content.split('\n').map((line, i) => {
              // Headings
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-900 mt-8 mb-3">{line.replace('### ', '')}</h3>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-900 mt-10 mb-4">{line.replace('## ', '')}</h2>;

              // Table header
              if (line.startsWith('| ') && line.includes('|')) {
                const cells = line.split('|').filter(c => c.trim());
                const nextLine = lesson.content.split('\n')[i + 1];
                const isHeader = nextLine && nextLine.includes('---');
                if (isHeader) {
                  return (
                    <div key={i} className="overflow-x-auto my-4">
                      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gray-50">
                            {cells.map((cell, j) => (
                              <th key={j} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">{cell.trim()}</th>
                            ))}
                          </tr>
                        </thead>
                      </table>
                    </div>
                  );
                }
                // Table separator row — skip
                if (cells.every(c => c.trim().match(/^-+$/))) return null;
                // Table data row
                return (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    {cells.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700">{renderInline(cell.trim())}</td>
                    ))}
                  </tr>
                );
              }

              // Bullet points
              if (line.startsWith('- ')) return <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 mb-1.5 list-disc">{renderInline(line.replace('- ', ''))}</li>;
              if (line.match(/^\d+\.\s/)) return <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 mb-1.5 list-decimal">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>;

              // Empty line
              if (line.trim() === '') return <div key={i} className="h-3" />;

              // Regular paragraph
              return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{renderInline(line)}</p>;
            })}
          </article>

          {/* Action bar */}
          <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between gap-4">
            {!isCompleted ? (
              <Button onClick={() => handleComplete(lesson.id)} icon={<CheckCircle size={16} />} className="flex-1 sm:flex-none">
                Mark as Complete
              </Button>
            ) : nextLesson && nextLessonAvailable ? (
              <Button onClick={() => setSelectedLesson(nextLesson.id)} icon={<ChevronRight size={16} />} className="flex-1 sm:flex-none">
                Next: {nextLesson.title}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                <CheckCircle size={16} />
                Lesson completed!
              </div>
            )}
            <Button variant="ghost" onClick={() => setSelectedLesson(null)}>
              All Lessons
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Lessons List View ───
  if (selectedCourse && course) {
    const courseCompleted = course.lessons.every(l => progress.completedLessons.includes(l.id));
    const coursePct = course.lessons.length > 0
      ? Math.round((course.lessons.filter(l => progress.completedLessons.includes(l.id)).length / course.lessons.length) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-white animate-fade-in">
        <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft size={16} /> Back to courses
          </button>

          <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="text-2xl mb-2">{course.icon}</div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1">{course.description}</p>
            </div>
            {courseCompleted && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-xl shrink-0">
                <Award size={16} />
                <span className="text-xs font-semibold">Completed</span>
              </div>
            )}
          </div>

          {/* Course progress bar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Course Progress</span>
              <span className="font-semibold text-gray-900 font-num">{coursePct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={cn('h-2 rounded-full transition-all duration-500', coursePct === 100 ? 'bg-green-500' : 'bg-[#0b8a00]')} style={{ width: `${coursePct}%` }} />
            </div>
          </div>

          <div className="space-y-3">
            {course.lessons.map((les, index) => {
              const status = getLessonStatus(les.id, course, index);
              return (
                <Card
                  key={les.id}
                  hover={status !== 'locked'}
                  className={cn(
                    'cursor-pointer transition-all',
                    status === 'locked' && 'opacity-50 cursor-not-allowed',
                    status === 'completed' && 'border-green-200 bg-green-50/30',
                  )}
                  onClick={() => {
                    if (status !== 'locked') {
                      setSelectedLesson(les.id);
                      trackEvent('lesson_opened', les.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                      status === 'completed' ? 'bg-green-100 text-green-600' :
                      status === 'locked' ? 'bg-gray-100 text-gray-400' :
                      'bg-blue-100 text-blue-600'
                    )}>
                      {status === 'completed' ? <CheckCircle size={20} /> :
                       status === 'locked' ? <Lock size={20} /> :
                       <PlayCircle size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base text-gray-900">Lesson {index + 1}: {les.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{les.duration} minutes</p>
                    </div>
                    <Badge status={status} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Courses Grid View (Abaci Academy Home) ───
  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={24} className="text-[#0b8a00]" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">Abaci Academy</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base mt-1">Learn Bangladesh stock market from basics to advanced — completely free</p>
          </div>
          {stats.isQualified && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl">
              <Award size={18} />
              <span className="text-sm font-medium">Qualified to Trade</span>
            </div>
          )}
        </div>

        {/* Overall Progress */}
        <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-[#0b8a00]/5 to-transparent border-[#0b8a00]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-gray-900">Overall Progress</span>
            <span className="text-sm text-gray-500 font-num">{stats.completedLessons}/{stats.totalLessons} lessons</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={cn('h-2.5 rounded-full transition-all duration-500', stats.isQualified ? 'bg-green-500' : 'bg-[#0b8a00]')} style={{ width: `${stats.progressPercent}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {stats.isQualified
              ? 'All required courses completed! You are ready to trade.'
              : `Complete all required courses (${stats.completedRequired}/${stats.requiredLessons} done) to unlock full trading readiness.`}
          </p>
        </Card>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {ACADEMY_COURSES.map(c => {
            const completed = c.lessons.filter(l => progress.completedLessons.includes(l.id)).length;
            const pct = c.lessons.length > 0 ? (completed / c.lessons.length) * 100 : 0;
            return (
              <Card
                key={c.id}
                hover
                onClick={() => {
                  setSelectedCourse(c.id);
                  trackEvent('course_opened', c.id);
                }}
                className={cn(pct === 100 && 'border-green-200')}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900">{c.title}</h3>
                    {c.isRequired && (
                      <span className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">Required</span>
                    )}
                  </div>
                  {pct === 100 && <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />}
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between text-sm mb-2.5">
                  <span className="text-gray-500">{c.lessons.length} lessons</span>
                  <span className="font-medium font-num text-gray-900">{completed}/{c.lessons.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={cn('h-2 rounded-full transition-all', pct === 100 ? 'bg-green-500' : 'bg-[#0b8a00]')} style={{ width: `${pct}%` }} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* More features (was MorePage) */}
        <div className="mt-10 sm:mt-12">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">More features</h2>
            <p className="text-gray-500 text-sm mt-0.5">All Abaci Investments tools and resources</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {moreItems.map(item => (
              <Link key={item.to} to={item.to}>
                <Card hover className="!p-4 sm:!p-5 h-full">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{item.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline text renderer (bold, code, emoji) ──
function renderInline(text: string) {
  // Simple bold and code rendering
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-800">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
