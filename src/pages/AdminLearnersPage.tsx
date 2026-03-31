import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  GraduationCap,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminLearnerView } from '@/types/demo';

export function AdminLearnersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: learners, isLoading } = useQuery({
    queryKey: ['admin-learners'],
    queryFn: async (): Promise<AdminLearnerView[]> => {
      // Join demo_accounts with profiles and learner_profiles
      const { data: accounts, error: acctErr } = await supabase
        .from('demo_accounts')
        .select('*');

      if (acctErr) throw acctErr;
      if (!accounts || accounts.length === 0) return [];

      const userIds = accounts.map((a: any) => a.user_id);

      const [profilesRes, learnerRes, tradesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        supabase.from('learner_profiles').select('user_id, readiness_score').in('user_id', userIds),
        supabase.from('demo_trades').select('demo_account_id'),
      ]);

      const profileMap = new Map<string, { full_name: string; email: string }>();
      for (const p of profilesRes.data || []) {
        profileMap.set(p.id, { full_name: p.full_name, email: p.email });
      }

      const readinessMap = new Map<string, number>();
      for (const l of learnerRes.data || []) {
        readinessMap.set(l.user_id, l.readiness_score);
      }

      const tradeCountMap = new Map<string, number>();
      for (const t of tradesRes.data || []) {
        tradeCountMap.set(t.demo_account_id, (tradeCountMap.get(t.demo_account_id) || 0) + 1);
      }

      return accounts.map((a: any): AdminLearnerView => {
        const profile = profileMap.get(a.user_id);
        return {
          user_id: a.user_id,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          demo_account_id: a.id,
          account_code: a.account_code,
          available_cash: Number(a.available_cash),
          portfolio_value: Number(a.available_cash) + Number(a.market_value),
          total_trades: tradeCountMap.get(a.id) || 0,
          lessons_completed: 0,
          readiness_score: readinessMap.get(a.user_id) || 0,
          last_activity: a.updated_at,
          status: a.status,
        };
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data: account } = await supabase
        .from('demo_accounts')
        .select('starting_cash')
        .eq('id', accountId)
        .single();

      if (!account) throw new Error('Account not found');

      // Delete related data
      await supabase.from('demo_trades').delete().eq('demo_account_id', accountId);
      await supabase.from('demo_orders').delete().eq('demo_account_id', accountId);
      await supabase.from('demo_positions').delete().eq('demo_account_id', accountId);
      await supabase.from('demo_cash_ledger').delete().eq('demo_account_id', accountId);
      await supabase.from('demo_statements').delete().eq('demo_account_id', accountId);

      await supabase.from('demo_accounts').update({
        available_cash: account.starting_cash,
        buying_power: account.starting_cash,
        market_value: 0,
        unrealized_pnl: 0,
        realized_pnl: 0,
        updated_at: new Date().toISOString(),
      }).eq('id', accountId);

      await supabase.from('demo_cash_ledger').insert({
        demo_account_id: accountId,
        entry_type: 'reset',
        credit: account.starting_cash,
        debit: 0,
        balance_after: account.starting_cash,
        narration: 'Account reset by admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learners'] });
      toast.success('Account reset successfully');
    },
    onError: (err: any) => {
      toast.error('Reset failed', { description: err?.message });
    },
  });

  const filtered = (learners || []).filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.full_name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.account_code.toLowerCase().includes(q)
    );
  });

  const totalLearners = learners?.length || 0;
  const readyCount = (learners || []).filter((l) => l.readiness_score >= 70).length;
  const avgReadiness = totalLearners > 0
    ? Math.round((learners || []).reduce((s, l) => s + l.readiness_score, 0) / totalLearners)
    : 0;

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">Demo Learners</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Manage and monitor all demo trading accounts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <StatCard
            title="Total Learners"
            value={totalLearners}
            icon={<Users size={20} />}
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Avg Readiness"
            value={`${avgReadiness}%`}
            icon={<GraduationCap size={20} />}
            iconColor="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Ready for Live"
            value={readyCount}
            icon={<ShieldCheck size={20} />}
            iconColor="bg-green-100 text-green-600"
          />
        </div>

        {/* Search */}
        <div className="relative mb-5 sm:mb-6">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or account code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/30 focus:border-[#0b8a00]/30 shadow-sm transition-all"
          />
        </div>

        {/* Table */}
        <Card padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200 bg-gray-50/80">
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-3 py-3.5 font-medium hidden md:table-cell">Email</th>
                  <th className="px-3 py-3.5 font-medium">Account</th>
                  <th className="px-3 py-3.5 font-medium text-right">Cash</th>
                  <th className="px-3 py-3.5 font-medium text-right">Portfolio</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden sm:table-cell">Trades</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden lg:table-cell">Readiness</th>
                  <th className="px-3 py-3.5 font-medium hidden xl:table-cell">Last Activity</th>
                  <th className="px-5 py-3.5 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center">
                      <Loader2 size={20} className="animate-spin text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Loading learners...</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                      No learners found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((learner, idx) => (
                    <tr
                      key={learner.demo_account_id}
                      className={cn('border-b border-gray-100 last:border-0', idx % 2 === 1 && 'bg-gray-50/50')}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">{learner.full_name}</div>
                      </td>
                      <td className="px-3 py-3.5 text-gray-600 hidden md:table-cell">{learner.email}</td>
                      <td className="px-3 py-3.5">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {learner.account_code}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-num">{formatCurrency(learner.available_cash)}</td>
                      <td className="px-3 py-3.5 text-right font-num font-medium">{formatCurrency(learner.portfolio_value)}</td>
                      <td className="px-3 py-3.5 text-right font-num hidden sm:table-cell">{learner.total_trades}</td>
                      <td className="px-3 py-3.5 text-right hidden lg:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                learner.readiness_score >= 70 ? 'bg-green-500' :
                                learner.readiness_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${Math.min(100, learner.readiness_score)}%` }}
                            />
                          </div>
                          <span className="font-num text-xs font-medium">{learner.readiness_score}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-gray-500 hidden xl:table-cell">
                        {formatDateTime(learner.last_activity)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<RefreshCw size={14} />}
                          onClick={() => {
                            if (confirm(`Reset account for ${learner.full_name}?`)) {
                              resetMutation.mutate(learner.demo_account_id);
                            }
                          }}
                          loading={resetMutation.isPending}
                          className="text-gray-500 hover:text-red-600"
                        >
                          Reset
                        </Button>
                      </td>
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
