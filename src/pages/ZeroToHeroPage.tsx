import { useUserXp, useAchievements, useLeaderboard } from '@/hooks/useGamification';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Zap, Trophy, Lock, CheckCircle, Star, Award, Target, Shield, Crown } from 'lucide-react';

const MILESTONES = [
  { level: 1, title: 'Beginner', description: 'Start your investment journey', xpRequired: 0, icon: Star, color: 'text-gray-500', bg: 'bg-gray-100' },
  { level: 2, title: 'Learner', description: 'Complete basic courses and make first trade', xpRequired: 100, icon: Target, color: 'text-info', bg: 'bg-info/10' },
  { level: 3, title: 'Trader', description: 'Build a diversified portfolio', xpRequired: 500, icon: Award, color: 'text-warning', bg: 'bg-warning/10' },
  { level: 4, title: 'Expert', description: 'Consistent returns and community contribution', xpRequired: 1500, icon: Shield, color: 'text-success', bg: 'bg-success/10' },
  { level: 5, title: 'Hero', description: 'Master investor with proven track record', xpRequired: 5000, icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50' },
];

export function ZeroToHeroPage() {
  const { data: userXp } = useUserXp();
  const { data: achievements } = useAchievements();
  const { data: leaderboard } = useLeaderboard();

  const currentXp = userXp?.total_xp || 0;
  const currentLevel = userXp?.level || 1;

  // Calculate progress to next level
  const currentMilestone = MILESTONES.find(m => m.level === currentLevel) || MILESTONES[0];
  const nextMilestone = MILESTONES.find(m => m.level === currentLevel + 1);
  const progressPercent = nextMilestone
    ? Math.min(100, ((currentXp - currentMilestone.xpRequired) / (nextMilestone.xpRequired - currentMilestone.xpRequired)) * 100)
    : 100;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Zero to Hero</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Your investment learning journey</p>
      </div>

      {/* XP Progress */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl ${currentMilestone.bg} flex items-center justify-center`}>
            <currentMilestone.icon size={28} className={currentMilestone.color} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Level {currentLevel}: {currentMilestone.title}</h2>
              <Badge status="active" label={`${currentXp} XP`} />
            </div>
            <p className="text-sm text-muted mt-0.5">
              {nextMilestone
                ? `${nextMilestone.xpRequired - currentXp} XP to Level ${nextMilestone.level}`
                : 'Maximum level reached!'}
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-info to-success h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>{currentMilestone.xpRequired} XP</span>
          <span>{nextMilestone ? `${nextMilestone.xpRequired} XP` : 'MAX'}</span>
        </div>
      </Card>

      {/* Achievement Badges */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Achievements</h2>
        {(achievements || []).length === 0 ? (
          <Card className="text-center py-8">
            <Award size={36} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">Complete tasks to earn achievements</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(achievements || []).map((ach) => (
              <Card
                key={ach.id}
                className={`text-center relative ${ach.is_earned ? '' : 'opacity-50'}`}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                  ach.is_earned ? 'bg-warning/15 text-warning' : 'bg-black/5 text-muted'
                }`}>
                  {ach.is_earned ? <CheckCircle size={24} /> : <Lock size={24} />}
                </div>
                <p className="text-xs font-semibold text-foreground">{ach.title}</p>
                <p className="text-[10px] text-muted mt-0.5 line-clamp-2">{ach.description}</p>
                <p className="text-[10px] font-semibold text-info mt-1">+{ach.xp_reward} XP</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Milestone Steps */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Milestones</h2>
        <div className="space-y-3">
          {MILESTONES.map((milestone) => {
            const isUnlocked = currentLevel >= milestone.level;
            const isCurrent = currentLevel === milestone.level;
            return (
              <Card
                key={milestone.level}
                className={`flex items-center gap-4 ${isCurrent ? 'border-primary/30 ring-1 ring-primary/10' : ''} ${!isUnlocked ? 'opacity-50' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl ${milestone.bg} flex items-center justify-center shrink-0`}>
                  {isUnlocked ? (
                    <milestone.icon size={24} className={milestone.color} />
                  ) : (
                    <Lock size={24} className="text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Level {milestone.level}: {milestone.title}</p>
                    {isCurrent && <Badge status="active" label="Current" pulse />}
                    {isUnlocked && !isCurrent && <Badge status="completed" label="Unlocked" />}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{milestone.description}</p>
                  <p className="text-xs font-num text-info mt-0.5">{milestone.xpRequired} XP required</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Leaderboard</h2>
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs border-b border-border">
                  <th className="px-5 py-3 text-left font-medium">Rank</th>
                  <th className="px-3 py-3 text-left font-medium">Investor</th>
                  <th className="px-3 py-3 text-right font-medium">XP</th>
                  <th className="px-5 py-3 text-right font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {(leaderboard || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted">No leaderboard data</td>
                  </tr>
                ) : (
                  (leaderboard || []).map((entry) => (
                    <tr key={entry.user_id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          entry.rank === 2 ? 'bg-gray-100 text-gray-600' :
                          entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'text-muted'
                        }`}>
                          {entry.rank <= 3 ? <Trophy size={12} /> : entry.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium">{entry.display_name}</td>
                      <td className="px-3 py-3 text-right font-num text-info">{entry.total_xp.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-num">{entry.level}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
