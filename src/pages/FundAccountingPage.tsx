import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';
import type { FundAccount, ClientFundLedgerEntry, FeeBilling, FundRequest } from '@/types';
import {
  Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Search, Plus,
  FileText, Clock, CheckCircle, XCircle, TrendingUp, Users,
  X, Check, CreditCard, Landmark, Receipt, Filter, Download,
} from 'lucide-react';

function useFundAccounts() {
  return useQuery({
    queryKey: ['fund-accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('fund_accounts').select('*, profiles!fund_accounts_client_id_fkey(full_name, email)').order('updated_at', { ascending: false });
      return (data || []).map((f: any) => ({ ...f, client_name: f.profiles?.full_name, client_email: f.profiles?.email })) as (FundAccount & { client_name?: string; client_email?: string })[];
    },
  });
}

function useFundLedger(accountId: string | null) {
  return useQuery({
    queryKey: ['fund-ledger', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase.from('client_funds_ledger').select('*').eq('fund_account_id', accountId).order('created_at', { ascending: false }).limit(100);
      return (data || []) as ClientFundLedgerEntry[];
    },
    enabled: !!accountId,
  });
}

function useFundRequests() {
  return useQuery({
    queryKey: ['fund-requests'],
    queryFn: async () => {
      const { data } = await supabase.from('fund_requests').select('*, profiles!fund_requests_client_id_fkey(full_name)').order('created_at', { ascending: false }).limit(50);
      return (data || []).map((r: any) => ({ ...r, client_name: r.profiles?.full_name })) as (FundRequest & { client_name?: string })[];
    },
  });
}

function useFeeBillings() {
  return useQuery({
    queryKey: ['fee-billings'],
    queryFn: async () => {
      const { data } = await supabase.from('fee_billing').select('*, profiles!fee_billing_client_id_fkey(full_name)').order('created_at', { ascending: false }).limit(50);
      return (data || []).map((f: any) => ({ ...f, client_name: f.profiles?.full_name })) as (FeeBilling & { client_name?: string })[];
    },
  });
}

function LedgerEntryModal({ account, onClose }: { account: FundAccount & { client_name?: string }; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    entry_type: 'deposit' as string,
    amount: '',
    description: '',
    counterparty: '',
    value_date: new Date().toISOString().split('T')[0],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const amount = Number(form.amount);
      const isCredit = ['deposit', 'sell_settlement', 'dividend', 'interest', 'ipo_refund'].includes(form.entry_type);
      const newBalance = account.cash_balance + (isCredit ? amount : -amount);

      await supabase.from('client_funds_ledger').insert({
        fund_account_id: account.id,
        client_id: account.client_id,
        entry_type: form.entry_type,
        description: form.description || `${form.entry_type.replace(/_/g, ' ')} - BDT ${amount.toLocaleString()}`,
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        running_balance: newBalance,
        counterparty: form.counterparty || null,
        value_date: form.value_date,
        recorded_by: user?.id,
        status: 'posted',
      });

      await supabase.from('fund_accounts').update({
        cash_balance: newBalance,
        available_balance: newBalance - account.payables,
        total_deposits: isCredit && form.entry_type === 'deposit' ? account.total_deposits + amount : account.total_deposits,
        total_withdrawals: !isCredit && form.entry_type === 'withdrawal' ? account.total_withdrawals + amount : account.total_withdrawals,
        total_fees_charged: ['management_fee', 'performance_fee', 'custody_fee'].includes(form.entry_type) ? account.total_fees_charged + amount : account.total_fees_charged,
        total_dividends_received: form.entry_type === 'dividend' ? account.total_dividends_received + amount : account.total_dividends_received,
        last_transaction_date: form.value_date,
        updated_at: new Date().toISOString(),
      }).eq('id', account.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['fund-ledger'] });
      onClose();
    },
  });

  const entryTypes = [
    { value: 'deposit', label: 'Deposit', color: 'text-success' },
    { value: 'withdrawal', label: 'Withdrawal', color: 'text-danger' },
    { value: 'management_fee', label: 'Management Fee', color: 'text-danger' },
    { value: 'performance_fee', label: 'Performance Fee', color: 'text-danger' },
    { value: 'custody_fee', label: 'Custody Fee', color: 'text-danger' },
    { value: 'dividend', label: 'Dividend Received', color: 'text-success' },
    { value: 'buy_settlement', label: 'Buy Settlement', color: 'text-danger' },
    { value: 'sell_settlement', label: 'Sell Settlement', color: 'text-success' },
    { value: 'adjustment', label: 'Adjustment', color: 'text-muted' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">Post Ledger Entry</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
        </div>
        <p className="text-xs text-muted mb-4">Client: <strong>{account.client_name}</strong> &middot; Balance: <strong>{formatCurrency(account.cash_balance)}</strong></p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">Entry Type</label>
            <select value={form.entry_type} onChange={e => setForm(f => ({ ...f, entry_type: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
              {entryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="Amount (BDT) *" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
          <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Bank transfer from DBBL" />
          <Input label="Counterparty" value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} placeholder="e.g. Dutch-Bangla Bank" />
          <Input label="Value Date" type="date" value={form.value_date} onChange={e => setForm(f => ({ ...f, value_date: e.target.value }))} />

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!form.amount} className="flex-1">
              <Check size={16} /> Post Entry
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

type ViewTab = 'accounts' | 'requests' | 'fees';

export function FundAccountingPage() {
  const { data: accounts = [], isLoading } = useFundAccounts();
  const { data: requests = [] } = useFundRequests();
  const { data: fees = [] } = useFeeBillings();
  const [viewTab, setViewTab] = useState<ViewTab>('accounts');
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<(FundAccount & { client_name?: string; client_email?: string }) | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const { data: ledger = [] } = useFundLedger(selectedAccount?.id ?? null);

  const totals = useMemo(() => ({
    totalCash: accounts.reduce((s, a) => s + a.cash_balance, 0),
    totalReceivables: accounts.reduce((s, a) => s + a.receivables, 0),
    totalPayables: accounts.reduce((s, a) => s + a.payables, 0),
    pendingRequests: requests.filter(r => r.status === 'requested' || r.status === 'approved').length,
  }), [accounts, requests]);

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((a: any) => a.client_name?.toLowerCase().includes(q) || a.client_email?.toLowerCase().includes(q));
  }, [accounts, search]);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-3">
              <Wallet size={28} className="text-primary" />
              Client Fund Accounting
            </h1>
            <p className="text-muted text-sm mt-1">Deposits, withdrawals, fee billing, cash positions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="Total Cash" value={formatCurrency(totals.totalCash)} icon={<DollarSign size={18} />} iconColor="bg-emerald-50 text-emerald-600" />
          <StatCard title="Receivables" value={formatCurrency(totals.totalReceivables)} icon={<ArrowDownRight size={18} />} iconColor="bg-blue-50 text-blue-600" />
          <StatCard title="Payables" value={formatCurrency(totals.totalPayables)} icon={<ArrowUpRight size={18} />} iconColor="bg-red-50 text-red-600" />
          <StatCard title="Pending Requests" value={totals.pendingRequests} icon={<Clock size={18} />} iconColor="bg-amber-50 text-amber-600" />
        </div>

        {/* Top tabs */}
        <div className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-5">
          {([
            { id: 'accounts' as ViewTab, label: 'Fund Accounts', icon: Wallet },
            { id: 'requests' as ViewTab, label: `Requests (${totals.pendingRequests})`, icon: FileText },
            { id: 'fees' as ViewTab, label: 'Fee Billing', icon: Receipt },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setViewTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex-1 justify-center',
                viewTab === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground')}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Accounts Tab */}
        {viewTab === 'accounts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1">
              <Card>
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" placeholder="Search client..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />) :
                   filtered.length === 0 ? <p className="text-sm text-muted text-center py-8">No fund accounts</p> :
                   filtered.map((a: any) => (
                    <button key={a.id} onClick={() => setSelectedAccount(a)}
                      className={cn('w-full text-left px-3 py-3 rounded-xl border transition-all',
                        selectedAccount?.id === a.id ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-gray-50')}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate">{a.client_name || 'Unnamed'}</p>
                        <p className={cn('text-sm font-bold font-num', a.cash_balance >= 0 ? 'text-success' : 'text-danger')}>
                          {formatCurrency(a.cash_balance)}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted">{a.account_name} &middot; {a.currency}</p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {!selectedAccount ? (
                <Card className="flex flex-col items-center justify-center h-[500px]">
                  <Wallet size={40} className="text-muted/30 mb-3" />
                  <p className="text-sm text-muted">Select an account to view ledger</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-lg font-bold">{selectedAccount.client_name}</h2>
                        <p className="text-xs text-muted">{selectedAccount.account_name} &middot; {selectedAccount.currency}</p>
                      </div>
                      <Button size="sm" onClick={() => setShowLedgerModal(true)} icon={<Plus size={14} />}>Post Entry</Button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-muted uppercase">Cash Balance</p>
                        <p className="text-base font-bold font-num">{formatCurrency(selectedAccount.cash_balance)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase">Available</p>
                        <p className="text-base font-bold font-num">{formatCurrency(selectedAccount.available_balance)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase">Total Deposits</p>
                        <p className="text-base font-bold font-num text-success">{formatCurrency(selectedAccount.total_deposits)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase">Total Fees</p>
                        <p className="text-base font-bold font-num text-danger">{formatCurrency(selectedAccount.total_fees_charged)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding={false}>
                    <div className="px-4 pt-4 pb-2">
                      <h3 className="text-sm font-semibold">Ledger ({ledger.length} entries)</h3>
                    </div>
                    {ledger.length === 0 ? (
                      <p className="text-sm text-muted text-center py-12">No ledger entries</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Description</th>
                            <th className="px-4 py-3 font-medium text-right">Debit</th>
                            <th className="px-4 py-3 font-medium text-right">Credit</th>
                            <th className="px-4 py-3 font-medium text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledger.map(e => (
                            <tr key={e.id} className="border-t border-border/30 hover:bg-gray-50">
                              <td className="px-4 py-2.5 text-xs font-num text-muted">{e.value_date}</td>
                              <td className="px-4 py-2.5">
                                <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                                  e.credit > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                                  {e.entry_type.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted truncate max-w-[200px]">{e.description}</td>
                              <td className="px-4 py-2.5 text-right font-num text-danger">{e.debit > 0 ? formatCurrency(e.debit) : ''}</td>
                              <td className="px-4 py-2.5 text-right font-num text-success">{e.credit > 0 ? formatCurrency(e.credit) : ''}</td>
                              <td className="px-4 py-2.5 text-right font-num font-medium">{formatCurrency(e.running_balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {viewTab === 'requests' && (
          <Card padding={false}>
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold">Deposit & Withdrawal Requests</h3>
            </div>
            {requests.length === 0 ? (
              <p className="text-sm text-muted text-center py-12">No fund requests</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => (
                    <tr key={r.id} className="border-t border-border/30 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs font-num text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold">{r.client_name || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-xs font-bold uppercase', r.request_type === 'deposit' ? 'text-success' : 'text-danger')}>
                          {r.request_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-num font-medium">{formatCurrency(r.amount)}</td>
                      <td className="px-4 py-2.5 text-xs text-muted capitalize">{r.payment_method || '—'}</td>
                      <td className="px-4 py-2.5"><Badge status={r.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* Fees Tab */}
        {viewTab === 'fees' && (
          <Card padding={false}>
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold">Fee Billing History</h3>
            </div>
            {fees.length === 0 ? (
              <p className="text-sm text-muted text-center py-12">No fee billings yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Fee Type</th>
                    <th className="px-4 py-3 font-medium text-right">AUM Basis</th>
                    <th className="px-4 py-3 font-medium text-right">Rate</th>
                    <th className="px-4 py-3 font-medium text-right">Net Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f: any) => (
                    <tr key={f.id} className="border-t border-border/30 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs font-num text-muted">{f.billing_period_start} to {f.billing_period_end}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold">{f.client_name || '—'}</td>
                      <td className="px-4 py-2.5 text-xs capitalize">{f.fee_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 text-right font-num">{formatCurrency(f.aum_basis)}</td>
                      <td className="px-4 py-2.5 text-right font-num">{f.fee_rate}%</td>
                      <td className="px-4 py-2.5 text-right font-num font-semibold">{formatCurrency(f.net_amount)}</td>
                      <td className="px-4 py-2.5"><Badge status={f.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>

      {showLedgerModal && selectedAccount && (
        <LedgerEntryModal account={selectedAccount} onClose={() => setShowLedgerModal(false)} />
      )}
    </div>
  );
}
