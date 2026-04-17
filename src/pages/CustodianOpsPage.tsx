import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';
import type { CustodianAccount, CorporateAction, SettlementRecord } from '@/types';
import {
  ShieldCheck, Landmark, Search, Plus, FileText, Clock, CheckCircle,
  AlertTriangle, Calendar, TrendingUp, Users, X, Check, DollarSign,
  ArrowRightLeft, Building2, Bell, Activity, Filter,
} from 'lucide-react';

function useCustodianAccounts() {
  return useQuery({
    queryKey: ['custodian-accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('custodian_accounts').select('*, profiles!custodian_accounts_client_id_fkey(full_name, email, bo_account)').order('created_at', { ascending: false });
      return (data || []).map((a: any) => ({ ...a, client_name: a.profiles?.full_name, client_email: a.profiles?.email })) as (CustodianAccount & { client_name?: string; client_email?: string })[];
    },
  });
}

function useCorporateActions() {
  return useQuery({
    queryKey: ['corporate-actions'],
    queryFn: async () => {
      const { data } = await supabase.from('corporate_actions').select('*').order('created_at', { ascending: false }).limit(50);
      return (data || []) as CorporateAction[];
    },
  });
}

function useSettlements() {
  return useQuery({
    queryKey: ['settlements'],
    queryFn: async () => {
      const { data } = await supabase.from('settlement_tracking').select('*, profiles!settlement_tracking_client_id_fkey(full_name)').order('settlement_date', { ascending: true }).limit(100);
      return (data || []).map((s: any) => ({ ...s, client_name: s.profiles?.full_name })) as (SettlementRecord & { client_name?: string })[];
    },
  });
}

function CorporateActionModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    action_type: 'cash_dividend' as string,
    symbol: '',
    security_name: '',
    rate: '',
    record_date: '',
    ex_date: '',
    payment_date: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await supabase.from('corporate_actions').insert({
        action_type: form.action_type,
        symbol: form.symbol.toUpperCase(),
        security_name: form.security_name || null,
        rate: Number(form.rate) || null,
        record_date: form.record_date || null,
        ex_date: form.ex_date || null,
        payment_date: form.payment_date || null,
        status: 'declared',
        notes: form.notes || null,
        source: 'manual',
        created_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-actions'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">Record Corporate Action</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">Action Type</label>
            <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="cash_dividend">Cash Dividend</option>
              <option value="stock_dividend">Stock Dividend</option>
              <option value="bonus_share">Bonus Share</option>
              <option value="rights_issue">Rights Issue</option>
              <option value="stock_split">Stock Split</option>
              <option value="ipo">IPO Allotment</option>
              <option value="merger">Merger</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Symbol *" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="e.g. BRACBANK" />
            <Input label="Security Name" value={form.security_name} onChange={e => setForm(f => ({ ...f, security_name: e.target.value }))} placeholder="BRAC Bank Ltd" />
            <Input label="Rate / Amount *" type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="BDT per share or ratio" />
            <Input label="Record Date" type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} />
            <Input label="Ex-Date" type="date" value={form.ex_date} onChange={e => setForm(f => ({ ...f, ex_date: e.target.value }))} />
            <Input label="Payment Date" type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
          </div>

          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!form.symbol || !form.rate} className="flex-1">
              <Check size={16} /> Record Action
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

type ViewTab = 'bo_registry' | 'corporate_actions' | 'settlements';

export function CustodianOpsPage() {
  const { data: accounts = [], isLoading: loadingAccounts } = useCustodianAccounts();
  const { data: actions = [], isLoading: loadingActions } = useCorporateActions();
  const { data: settlements = [], isLoading: loadingSettlements } = useSettlements();
  const [viewTab, setViewTab] = useState<ViewTab>('bo_registry');
  const [search, setSearch] = useState('');
  const [showCAModal, setShowCAModal] = useState(false);

  const stats = useMemo(() => ({
    totalBOs: accounts.filter(a => a.status === 'active').length,
    pendingActions: actions.filter(a => !['applied', 'completed'].includes(a.status)).length,
    pendingSettlements: settlements.filter(s => s.status === 'pending').length,
    failedSettlements: settlements.filter(s => s.status === 'failed').length,
  }), [accounts, actions, settlements]);

  const filteredAccounts = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((a: any) => a.client_name?.toLowerCase().includes(q) || a.bo_account.includes(q));
  }, [accounts, search]);

  const pendingSettlements = useMemo(() => settlements.filter(s => s.status === 'pending' || s.status === 'partial'), [settlements]);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-3">
              <Landmark size={28} className="text-primary" />
              Custodian Operations
            </h1>
            <p className="text-muted text-sm mt-1">BO registry, corporate actions, settlement tracking</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="Active BO Accounts" value={stats.totalBOs} icon={<ShieldCheck size={18} />} iconColor="bg-blue-50 text-blue-600" />
          <StatCard title="Pending Corp Actions" value={stats.pendingActions} icon={<Bell size={18} />} iconColor="bg-purple-50 text-purple-600" />
          <StatCard title="Pending Settlements" value={stats.pendingSettlements} icon={<Clock size={18} />} iconColor="bg-amber-50 text-amber-600" />
          <StatCard title="Failed Settlements" value={stats.failedSettlements} icon={<AlertTriangle size={18} />} iconColor="bg-red-50 text-red-600" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-5">
          {([
            { id: 'bo_registry' as ViewTab, label: 'BO Registry', icon: ShieldCheck },
            { id: 'corporate_actions' as ViewTab, label: 'Corporate Actions', icon: Bell },
            { id: 'settlements' as ViewTab, label: 'Settlements', icon: ArrowRightLeft },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setViewTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex-1 justify-center',
                viewTab === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground')}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* BO Registry */}
        {viewTab === 'bo_registry' && (
          <Card padding={false}>
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Beneficiary Owner Accounts</h3>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" placeholder="Search BO or client..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            </div>
            {loadingAccounts ? <div className="skeleton h-64 m-4 rounded-xl" /> :
             filteredAccounts.length === 0 ? <p className="text-sm text-muted text-center py-12">No BO accounts registered</p> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">BO Account</th>
                    <th className="px-4 py-3 font-medium">DP ID</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Bank</th>
                    <th className="px-4 py-3 font-medium">Opened</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((a: any) => (
                    <tr key={a.id} className="border-t border-border/30 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-semibold">{a.client_name || '—'}</p>
                        <p className="text-[10px] text-muted">{a.client_email}</p>
                      </td>
                      <td className="px-4 py-2.5 font-num text-xs font-medium">{a.bo_account}</td>
                      <td className="px-4 py-2.5 font-num text-xs text-muted">{a.dp_id || '—'}</td>
                      <td className="px-4 py-2.5 text-xs capitalize">{a.account_type}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{a.linked_bank_name || '—'}</td>
                      <td className="px-4 py-2.5 text-xs font-num text-muted">{a.opened_date || '—'}</td>
                      <td className="px-4 py-2.5"><Badge status={a.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* Corporate Actions */}
        {viewTab === 'corporate_actions' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowCAModal(true)} icon={<Plus size={14} />}>Record Corporate Action</Button>
            </div>
            <Card padding={false}>
              {loadingActions ? <div className="skeleton h-64 m-4 rounded-xl" /> :
               actions.length === 0 ? <p className="text-sm text-muted text-center py-12">No corporate actions recorded</p> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                      <th className="px-4 py-3 font-medium">Symbol</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium text-right">Rate</th>
                      <th className="px-4 py-3 font-medium">Record Date</th>
                      <th className="px-4 py-3 font-medium">Ex-Date</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium text-right">Affected</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map(a => (
                      <tr key={a.id} className="border-t border-border/30 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-xs">{a.symbol}</p>
                          <p className="text-[10px] text-muted">{a.security_name}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                            a.action_type.includes('dividend') && 'bg-success/10 text-success',
                            a.action_type === 'bonus_share' && 'bg-info/10 text-info',
                            a.action_type === 'rights_issue' && 'bg-warning/10 text-warning',
                            a.action_type === 'stock_split' && 'bg-purple-500/10 text-purple-600',
                            a.action_type === 'ipo' && 'bg-primary/10 text-primary',
                          )}>
                            {a.action_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-num text-xs">{a.rate ?? '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-num text-muted">{a.record_date || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-num text-muted">{a.ex_date || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-num text-muted">{a.payment_date || '—'}</td>
                        <td className="px-4 py-2.5 text-right font-num text-xs">{a.affected_clients}</td>
                        <td className="px-4 py-2.5"><Badge status={a.status} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}

        {/* Settlements */}
        {viewTab === 'settlements' && (
          <Card padding={false}>
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold">Settlement Tracking (T+2 Calendar)</h3>
            </div>
            {loadingSettlements ? <div className="skeleton h-64 m-4 rounded-xl" /> :
             settlements.length === 0 ? <p className="text-sm text-muted text-center py-12">No settlements to track</p> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Symbol</th>
                    <th className="px-4 py-3 font-medium">Side</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Trade Date</th>
                    <th className="px-4 py-3 font-medium">Settlement</th>
                    <th className="px-4 py-3 font-medium">Broker</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s: any) => {
                    const isOverdue = s.status === 'pending' && new Date(s.settlement_date) < new Date();
                    return (
                      <tr key={s.id} className={cn('border-t border-border/30 hover:bg-gray-50', isOverdue && 'bg-danger/5')}>
                        <td className="px-4 py-2.5 text-xs font-semibold">{s.client_name || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold">{s.symbol}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn('text-xs font-bold uppercase', s.side === 'buy' ? 'text-success' : 'text-danger')}>{s.side}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-num text-xs">{s.quantity.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-num text-xs font-medium">{formatCurrency(s.amount)}</td>
                        <td className="px-4 py-2.5 text-xs font-num text-muted">{s.trade_date}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn('text-xs font-num', isOverdue ? 'text-danger font-semibold' : 'text-muted')}>
                            {s.settlement_date} {isOverdue && '⚠'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted">{s.broker_name || '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge status={isOverdue ? 'overdue' : s.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>

      {showCAModal && <CorporateActionModal onClose={() => setShowCAModal(false)} />}
    </div>
  );
}
