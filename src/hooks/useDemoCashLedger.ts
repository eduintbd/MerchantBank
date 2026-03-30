import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import type { DemoCashLedgerEntry } from '@/types/demo';

// ── Query: Fetch all cash ledger entries for current account ──

export function useDemoCashLedger() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-cash-ledger', demoAccount?.id],
    queryFn: async (): Promise<DemoCashLedgerEntry[]> => {
      if (!demoAccount) return [];

      const { data, error } = await supabase
        .from('demo_cash_ledger')
        .select('*')
        .eq('demo_account_id', demoAccount.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DemoCashLedgerEntry[];
    },
    enabled: !!demoAccount,
  });
}
