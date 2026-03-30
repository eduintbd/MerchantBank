import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import { useRunDemoEod } from '@/hooks/useDemoEod';
import { EodTimeline } from '@/components/eod/EodTimeline';
import { EodReplayPanel } from '@/components/eod/EodReplayPanel';
import { DailyStatement } from '@/components/eod/DailyStatement';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate, cn } from '@/lib/utils';
import { Play, Loader2, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EodRun, EodAccountResult, DemoStatement } from '@/types/demo';

export function EodReplayPage() {
  const { demoAccount } = useDemo();
  const runEod = useRunDemoEod();
  const [selectedRun, setSelectedRun] = useState<EodRun | null>(null);

  // Fetch EOD result for selected run
  const { data: eodResult } = useQuery({
    queryKey: ['eod-result', selectedRun?.id, demoAccount?.id],
    queryFn: async (): Promise<EodAccountResult | null> => {
      if (!selectedRun || !demoAccount) return null;
      const { data, error } = await supabase
        .from('eod_account_results')
        .select('*')
        .eq('eod_run_id', selectedRun.id)
        .eq('demo_account_id', demoAccount.id)
        .maybeSingle();
      if (error) throw error;
      return data as EodAccountResult | null;
    },
    enabled: !!selectedRun && !!demoAccount,
  });

  // Fetch statement for selected run
  const { data: statement } = useQuery({
    queryKey: ['eod-statement', selectedRun?.id, demoAccount?.id],
    queryFn: async (): Promise<DemoStatement | null> => {
      if (!selectedRun || !demoAccount) return null;
      const { data, error } = await supabase
        .from('demo_statements')
        .select('*')
        .eq('eod_run_id', selectedRun.id)
        .eq('demo_account_id', demoAccount.id)
        .maybeSingle();
      if (error) throw error;
      return data as DemoStatement | null;
    },
    enabled: !!selectedRun && !!demoAccount,
  });

  async function handleRunEod() {
    try {
      await runEod.mutateAsync();
      toast.success('EOD Processing Complete', {
        description: 'Your end-of-day processing has been completed successfully.',
      });
    } catch (err: any) {
      toast.error('EOD Processing Failed', {
        description: err?.message || 'Please try again later.',
      });
    }
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">End of Day Replay</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Process your daily trading activity and review what happened step by step
          </p>
        </div>

        {/* Run EOD Section */}
        <Card className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0b8a00]/10 flex items-center justify-center">
                <Calendar size={22} className="text-[#0b8a00]" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-gray-900">Run End-of-Day Process</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Processes pending orders, updates holdings, calculates P&L, and generates your daily statement.
                </p>
              </div>
            </div>
            <Button
              onClick={handleRunEod}
              loading={runEod.isPending}
              disabled={!demoAccount || runEod.isPending}
              icon={runEod.isPending ? undefined : <Play size={16} />}
              className="shrink-0"
            >
              {runEod.isPending ? 'Processing...' : 'Run EOD'}
            </Button>
          </div>

          {runEod.isPending && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-[#0b8a00]" />
                <div className="flex-1">
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0b8a00] rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
                <span className="text-xs text-gray-500">Processing...</span>
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Left: Timeline */}
          <div className="lg:col-span-1">
            <EodTimeline onSelectRun={setSelectedRun} selectedRunId={selectedRun?.id} />
          </div>

          {/* Right: Replay & Statement */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            {selectedRun ? (
              <>
                {/* Selected run info */}
                <Card className="bg-gray-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Viewing EOD for {formatDate(selectedRun.business_date)}
                    </span>
                  </div>
                </Card>

                {/* Replay panel */}
                {eodResult ? (
                  <EodReplayPanel eodResult={eodResult} />
                ) : (
                  <Card>
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={18} className="animate-spin text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Loading results...</span>
                    </div>
                  </Card>
                )}

                {/* Daily Statement */}
                {statement && <DailyStatement statement={statement} />}
              </>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Select an EOD run to view details</p>
                  <p className="text-xs text-gray-500 mt-1">Click on a date in the timeline to see the replay</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
