import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import {
  runEodForAccount,
  getOrCreateEodRun,
  saveEodResult,
  generateStatement,
} from '@/services/eodProcessor';
import type { EodRun, EodAccountResult, DemoStatement } from '@/types/demo';

// ── Query: Fetch EOD runs ordered by date desc ──

export function useDemoEodRuns() {
  return useQuery({
    queryKey: ['demo-eod-runs'],
    queryFn: async (): Promise<EodRun[]> => {
      const { data, error } = await supabase
        .from('eod_runs')
        .select('*')
        .order('business_date', { ascending: false });

      if (error) throw error;
      return (data || []) as EodRun[];
    },
  });
}

// ── Query: Fetch EOD result for current account and given run ──

export function useDemoEodResult(eodRunId: string | undefined) {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-eod-result', eodRunId, demoAccount?.id],
    queryFn: async (): Promise<EodAccountResult | null> => {
      if (!eodRunId || !demoAccount) return null;

      const { data, error } = await supabase
        .from('eod_account_results')
        .select('*')
        .eq('eod_run_id', eodRunId)
        .eq('demo_account_id', demoAccount.id)
        .maybeSingle();

      if (error) throw error;
      return data as EodAccountResult | null;
    },
    enabled: !!eodRunId && !!demoAccount,
  });
}

// ── Mutation: Run EOD processing ──

export function useRunDemoEod() {
  const { demoAccount, refreshAccount } = useDemo();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessDate?: string) => {
      if (!demoAccount) throw new Error('No demo account');

      const date = businessDate || new Date().toISOString().split('T')[0];

      // 1. Get or create the EOD run record
      const eodRun = await getOrCreateEodRun(date);

      // 2. Mark run as running
      await supabase
        .from('eod_runs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', eodRun.id);

      try {
        // 3. Run EOD processing for the account
        const summary = await runEodForAccount(demoAccount, date);

        // 4. Calculate portfolio value
        const portfolioValue = demoAccount.market_value + summary.closingCash;

        // 5. Save EOD result
        await saveEodResult(eodRun.id, demoAccount.id, summary, portfolioValue);

        // 6. Generate daily statement
        await generateStatement(demoAccount.id, eodRun.id, date, summary, portfolioValue);

        // 7. Mark run as completed
        await supabase
          .from('eod_runs')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', eodRun.id);

        return { eodRun, summary };
      } catch (err) {
        // Mark run as failed
        await supabase
          .from('eod_runs')
          .update({ status: 'failed', completed_at: new Date().toISOString() })
          .eq('id', eodRun.id);
        throw err;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['demo-eod-runs'] });
      queryClient.invalidateQueries({ queryKey: ['demo-eod-result'] });
      queryClient.invalidateQueries({ queryKey: ['demo-statements'] });
      queryClient.invalidateQueries({ queryKey: ['demo-orders'] });
      queryClient.invalidateQueries({ queryKey: ['demo-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['demo-portfolio-summary'] });
      queryClient.invalidateQueries({ queryKey: ['demo-cash-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['demo-account'] });
      queryClient.invalidateQueries({ queryKey: ['demo-performance'] });
      await refreshAccount();
    },
  });
}

// ── Query: Fetch statements for current account ──

export function useDemoStatements() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-statements', demoAccount?.id],
    queryFn: async (): Promise<DemoStatement[]> => {
      if (!demoAccount) return [];

      const { data, error } = await supabase
        .from('demo_statements')
        .select('*')
        .eq('demo_account_id', demoAccount.id)
        .order('business_date', { ascending: false });

      if (error) throw error;
      return (data || []) as DemoStatement[];
    },
    enabled: !!demoAccount,
  });
}
