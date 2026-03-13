import { useTopInvestors, useFollowInvestor, useUnfollowInvestor } from '@/hooks/useInvestors';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPercent } from '@/lib/utils';
import { Trophy, Users, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export function TopInvestorsPage() {
  const { data: investors, isLoading } = useTopInvestors();
  const followMutation = useFollowInvestor();
  const unfollowMutation = useUnfollowInvestor();

  const handleFollow = (investor: any) => {
    if (investor.is_followed) {
      unfollowMutation.mutate(investor.user_id, {
        onSuccess: () => toast.success(`Unfollowed ${investor.display_name}`),
      });
    } else {
      followMutation.mutate(investor.user_id, {
        onSuccess: () => toast.success(`Following ${investor.display_name}`),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-2 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Top Investors</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Learn from the best performers in the community</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted mt-3">Loading investors...</p>
        </div>
      ) : (investors || []).length === 0 ? (
        <Card className="text-center py-12">
          <Trophy size={40} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No public investor profiles yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(investors || []).map((investor, index) => {
            const rank = index + 1;
            const initials = (investor.display_name || 'A')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={investor.id} className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  rank === 2 ? 'bg-gray-100 text-gray-600' :
                  rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-black/5 text-muted'
                }`}>
                  {rank <= 3 ? <Trophy size={16} /> : rank}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {investor.avatar_url ? (
                    <img src={investor.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{investor.display_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs font-semibold font-num ${investor.total_return_pct >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatPercent(investor.total_return_pct)}
                    </span>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Users size={12} />
                      {investor.followers_count} followers
                    </span>
                  </div>
                </div>

                {/* Follow button */}
                <Button
                  variant={investor.is_followed ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleFollow(investor)}
                  loading={followMutation.isPending || unfollowMutation.isPending}
                  icon={investor.is_followed ? <UserMinus size={14} /> : <UserPlus size={14} />}
                >
                  {investor.is_followed ? 'Unfollow' : 'Follow'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}      </div>

    </div>
  );
}