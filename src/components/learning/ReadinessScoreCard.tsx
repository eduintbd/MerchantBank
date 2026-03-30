import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Loader2, ShieldCheck, BookOpen, BrainCircuit, BarChart3, Eye, Shield } from 'lucide-react';
import { useReadinessScore } from '@/hooks/useReadinessScore';

const CATEGORIES = [
  { key: 'lessonsCompleted', label: 'Lessons Completed', icon: BookOpen, color: 'bg-blue-500' },
  { key: 'quizAvgScore', label: 'Quiz Avg Score', icon: BrainCircuit, color: 'bg-purple-500' },
  { key: 'tradesPlaced', label: 'Trades Placed', icon: BarChart3, color: 'bg-green-500' },
  { key: 'eodReplaysViewed', label: 'EOD Replays Viewed', icon: Eye, color: 'bg-amber-500' },
  { key: 'mistakesAvoided', label: 'Mistakes Avoided', icon: Shield, color: 'bg-teal-500' },
] as const;

export function ReadinessScoreCard() {
  const { data: breakdown, isLoading } = useReadinessScore();

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">Loading readiness score...</span>
        </div>
      </Card>
    );
  }

  if (!breakdown) return null;

  const score = breakdown.totalScore;
  const isReady = breakdown.isReady;

  // SVG circle dimensions
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const categoryValues: Record<string, number> = {
    lessonsCompleted: breakdown.totalLessons > 0 ? Math.round((breakdown.lessonsCompleted / breakdown.totalLessons) * 100) : 0,
    quizAvgScore: Math.round(breakdown.quizAvgScore),
    tradesPlaced: Math.min(100, breakdown.tradesPlaced * 10), // 10 trades = 100%
    eodReplaysViewed: Math.min(100, breakdown.eodReplaysViewed * 20), // 5 replays = 100%
    mistakesAvoided: Math.min(100, breakdown.mistakesAvoided * 25), // 4 avoided = 100%
  };

  return (
    <Card>
      <div className="flex flex-col items-center">
        {/* Circular progress ring */}
        <div className="relative mb-6">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isReady ? '#0b8a00' : score >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-num text-gray-900">{score}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
          </div>
        </div>

        {/* Ready badge */}
        {isReady ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-6">
            <ShieldCheck size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-green-700">Ready for Live Trading</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">Score 70+ to be ready for live trading</p>
        )}

        {/* Category breakdown */}
        <div className="w-full space-y-3">
          {CATEGORIES.map(({ key, label, icon: Icon, color }) => {
            const value = categoryValues[key] ?? 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  <span className="text-xs font-bold font-num text-gray-700">{value}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', color)}
                    style={{ width: `${Math.min(100, value)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
