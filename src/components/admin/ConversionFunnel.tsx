import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Users, UserCheck, BarChart3, Eye, ShieldCheck, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface FunnelStep {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function ConversionFunnel() {
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['admin-conversion-funnel'],
    queryFn: async () => {
      const [signupsRes, onboardedRes, firstTradeRes, eodViewedRes, readyRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('learner_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('demo_trades').select('demo_account_id', { count: 'exact', head: true }),
        supabase.from('eod_account_results').select('demo_account_id', { count: 'exact', head: true }),
        supabase.from('learner_profiles').select('id', { count: 'exact', head: true }).gte('readiness_score', 70),
      ]);

      return {
        totalSignups: signupsRes.count ?? 0,
        onboarded: onboardedRes.count ?? 0,
        firstTrade: firstTradeRes.count ?? 0,
        eodViewed: eodViewedRes.count ?? 0,
        readyForLive: readyRes.count ?? 0,
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">Loading funnel data...</span>
        </div>
      </Card>
    );
  }

  if (!funnelData) return null;

  const steps: FunnelStep[] = [
    { label: 'Total Signups', count: funnelData.totalSignups, icon: Users, color: 'text-gray-700', bgColor: 'bg-gray-100' },
    { label: 'Onboarded', count: funnelData.onboarded, icon: UserCheck, color: 'text-blue-700', bgColor: 'bg-blue-100' },
    { label: 'First Trade', count: funnelData.firstTrade, icon: BarChart3, color: 'text-purple-700', bgColor: 'bg-purple-100' },
    { label: 'EOD Viewed', count: funnelData.eodViewed, icon: Eye, color: 'text-amber-700', bgColor: 'bg-amber-100' },
    { label: 'Ready for Live', count: funnelData.readyForLive, icon: ShieldCheck, color: 'text-green-700', bgColor: 'bg-green-100' },
  ];

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <Card>
      <h3 className="font-semibold text-base text-gray-900 mb-6">Conversion Funnel</h3>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const widthPct = Math.max(10, (step.count / maxCount) * 100);
          const prevCount = idx > 0 ? steps[idx - 1].count : null;
          const conversionRate = prevCount && prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : null;
          const Icon = step.icon;

          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', step.bgColor)}>
                    <Icon size={14} className={step.color} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{step.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {conversionRate && (
                    <span className="text-xs text-gray-400 font-num">{conversionRate}% conversion</span>
                  )}
                  <span className="text-sm font-bold font-num text-gray-900">{step.count}</span>
                </div>
              </div>
              <div className="w-full h-6 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                <div
                  className={cn(
                    'h-full rounded-lg transition-all duration-700',
                    idx === 0 ? 'bg-gray-200' :
                    idx === 1 ? 'bg-blue-200' :
                    idx === 2 ? 'bg-purple-200' :
                    idx === 3 ? 'bg-amber-200' :
                    'bg-green-200'
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall conversion */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Overall Conversion</p>
        <p className="text-2xl font-bold font-num text-gray-900 mt-1">
          {funnelData.totalSignups > 0
            ? ((funnelData.readyForLive / funnelData.totalSignups) * 100).toFixed(1)
            : '0.0'}%
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Signups to Ready for Live</p>
      </div>
    </Card>
  );
}
