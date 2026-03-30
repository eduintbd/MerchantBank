import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Star, Target } from 'lucide-react';
import type { ScenarioMission as ScenarioMissionType } from '@/types/demo';

interface ScenarioMissionProps {
  mission: ScenarioMissionType;
}

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'bg-green-100 text-green-700 border-green-200' },
  intermediate: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  advanced: { label: 'Advanced', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export function ScenarioMission({ mission }: ScenarioMissionProps) {
  const diffConfig = DIFFICULTY_CONFIG[mission.difficulty] || DIFFICULTY_CONFIG.beginner;
  const completedSteps = mission.steps.filter((s) => s.is_completed).length;
  const totalSteps = mission.steps.length;
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className={cn(mission.is_completed && 'ring-2 ring-green-200 bg-green-50/30')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            mission.is_completed ? 'bg-green-100' : 'bg-gray-100'
          )}>
            <Target size={20} className={mission.is_completed ? 'text-green-600' : 'text-gray-500'} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">{mission.title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{mission.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border', diffConfig.color)}>
            {diffConfig.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">{completedSteps} of {totalSteps} steps</span>
          <span className="text-xs font-bold font-num text-gray-700">{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              mission.is_completed ? 'bg-green-500' : 'bg-[#0b8a00]'
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step checklist */}
      <div className="space-y-2 mb-4">
        {mission.steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2.5">
            {step.is_completed ? (
              <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
            ) : (
              <Circle size={16} className="text-gray-300 shrink-0 mt-0.5" />
            )}
            <span className={cn(
              'text-sm leading-snug',
              step.is_completed ? 'text-gray-500 line-through' : 'text-gray-700'
            )}>
              {step.description}
            </span>
          </div>
        ))}
      </div>

      {/* XP Reward */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
        <Star size={14} className="text-amber-500" />
        <span className="text-xs font-semibold text-amber-700">{mission.xp_reward} XP Reward</span>
        {mission.is_completed && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-green-600">
            <CheckCircle size={12} /> Completed
          </span>
        )}
      </div>
    </Card>
  );
}
