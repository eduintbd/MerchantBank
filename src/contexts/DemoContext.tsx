import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { DemoAccount, LearnerProfile } from '@/types/demo';

interface DemoState {
  isDemoMode: boolean;
  demoAccount: DemoAccount | null;
  learnerProfile: LearnerProfile | null;
  isOnboarded: boolean;
  loading: boolean;
}

interface DemoContextType extends DemoState {
  enterDemoMode: () => Promise<void>;
  exitDemoMode: () => void;
  refreshAccount: () => Promise<void>;
  resetAccount: () => Promise<void>;
  createDemoAccount: (startingCash?: number) => Promise<DemoAccount>;
}

const DemoContext = createContext<DemoContextType | null>(null);

const DEFAULT_STARTING_CASH = 100000;

export function DemoProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<DemoState>({
    isDemoMode: false,
    demoAccount: null,
    learnerProfile: null,
    isOnboarded: false,
    loading: false,
  });

  // Auto-load demo account when authenticated; auto-create for guests
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDemoData(user.id);
    } else {
      setState(s => ({ ...s, demoAccount: null, learnerProfile: null, isOnboarded: false }));
    }
  }, [isAuthenticated, user?.id]);

  // Auto-provision demo account if none exists (seamless for guests)
  useEffect(() => {
    if (isAuthenticated && user && !state.loading && !state.demoAccount && state.isDemoMode === false) {
      // Small delay to avoid race with loadDemoData
      const timer = setTimeout(() => {
        if (!state.demoAccount) {
          createDemoAccount().catch(() => {});
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id, state.loading, state.demoAccount]);

  async function loadDemoData(userId: string) {
    setState(s => ({ ...s, loading: true }));

    const [accountRes, profileRes] = await Promise.all([
      supabase.from('demo_accounts').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('learner_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    setState(s => ({
      ...s,
      demoAccount: accountRes.data as DemoAccount | null,
      learnerProfile: profileRes.data as LearnerProfile | null,
      isOnboarded: !!profileRes.data,
      isDemoMode: !!accountRes.data,
      loading: false,
    }));
  }

  const createDemoAccount = useCallback(async (startingCash = DEFAULT_STARTING_CASH): Promise<DemoAccount> => {
    if (!user) throw new Error('Not authenticated');

    const accountCode = 'DEMO-' + user.id.substring(0, 8).toUpperCase();

    const { data, error } = await supabase.from('demo_accounts').upsert({
      user_id: user.id,
      account_code: accountCode,
      starting_cash: startingCash,
      available_cash: startingCash,
      buying_power: startingCash,
      market_value: 0,
      unrealized_pnl: 0,
      realized_pnl: 0,
      status: 'active',
    }, { onConflict: 'user_id' }).select().single();

    if (error) throw error;

    // Create initial cash ledger entry
    await supabase.from('demo_cash_ledger').insert({
      demo_account_id: data.id,
      entry_type: 'initial_funding',
      credit: startingCash,
      debit: 0,
      balance_after: startingCash,
      narration: `Initial virtual funding of ৳${startingCash.toLocaleString()}`,
    });

    const account = data as DemoAccount;
    setState(s => ({ ...s, demoAccount: account, isDemoMode: true }));
    return account;
  }, [user]);

  const enterDemoMode = useCallback(async () => {
    if (!user) return;
    if (state.demoAccount) {
      setState(s => ({ ...s, isDemoMode: true }));
      return;
    }
    await createDemoAccount();
  }, [user, state.demoAccount, createDemoAccount]);

  const exitDemoMode = useCallback(() => {
    setState(s => ({ ...s, isDemoMode: false }));
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!state.demoAccount) return;
    const { data } = await supabase
      .from('demo_accounts')
      .select('*')
      .eq('id', state.demoAccount.id)
      .single();
    if (data) {
      setState(s => ({ ...s, demoAccount: data as DemoAccount }));
    }
  }, [state.demoAccount]);

  const resetAccount = useCallback(async () => {
    if (!state.demoAccount || !user) return;

    const accountId = state.demoAccount.id;
    const startingCash = state.demoAccount.starting_cash;

    // Delete all related data
    await Promise.all([
      supabase.from('coaching_events').delete().eq('demo_account_id', accountId),
      supabase.from('fee_charges').delete().in('demo_trade_id',
        (await supabase.from('demo_trades').select('id').eq('demo_account_id', accountId)).data?.map(t => t.id) || []
      ),
    ]);

    await supabase.from('demo_trades').delete().eq('demo_account_id', accountId);
    await supabase.from('demo_orders').delete().eq('demo_account_id', accountId);
    await supabase.from('demo_positions').delete().eq('demo_account_id', accountId);
    await supabase.from('demo_cash_ledger').delete().eq('demo_account_id', accountId);
    await supabase.from('demo_statements').delete().eq('demo_account_id', accountId);

    // Reset account balances
    await supabase.from('demo_accounts').update({
      available_cash: startingCash,
      buying_power: startingCash,
      market_value: 0,
      unrealized_pnl: 0,
      realized_pnl: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', accountId);

    // Re-create initial ledger entry
    await supabase.from('demo_cash_ledger').insert({
      demo_account_id: accountId,
      entry_type: 'initial_funding',
      credit: startingCash,
      debit: 0,
      balance_after: startingCash,
      narration: `Account reset — virtual funding of ৳${startingCash.toLocaleString()}`,
    });

    await refreshAccount();
  }, [state.demoAccount, user, refreshAccount]);

  return (
    <DemoContext.Provider value={{ ...state, enterDemoMode, exitDemoMode, refreshAccount, resetAccount, createDemoAccount }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
}
