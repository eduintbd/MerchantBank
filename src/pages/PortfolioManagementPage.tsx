import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';
import type { ClientPortfolio, PortfolioHolding, PortfolioTransaction, PortfolioValuationRecord } from '@/types';
import {
  BarChart3, Plus, Search, TrendingUp, TrendingDown, Wallet, Users,
  ChevronRight, Eye, PieChart, ArrowUpRight, ArrowDownRight, Calendar,
  X, Check, Filter, Download, Activity, Briefcase, DollarSign,
} from 'lucide-react';

function usePortfolios() {
  return useQuery({
    queryKey: ['admin-portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_portfolios')
        .select('*, profiles!client_portfolios_client_id_fkey(full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        client_name: p.profiles?.full_name,
        client_email: p.profiles?.email,
      })) as ClientPortfolio[];
    },
  });
}

function usePortfolioHoldings(portfolioId: string | null) {
  return useQuery({
    queryKey: ['portfolio-holdings', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      const { data } = await supabase.from('portfolio_holdings').select('*').eq('portfolio_id', portfolioId).order('market_value', { ascending: false });
      return (data || []) as PortfolioHolding[];
    },
    enabled: !!portfolioId,
  });
}

function usePortfolioTransactions(portfolioId: string | null) {
  return useQuery({
    queryKey: ['portfolio-transactions', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      const { data } = await supabase.from('portfolio_transactions').select('*').eq('portfolio_id', portfolioId).order('trade_date', { ascending: false }).limit(50);
      return (data || []) as PortfolioTransaction[];
    },
    enabled: !!portfolioId,
  });
}

function usePortfolioValuations(portfolioId: string | null) {
  return useQuery({
    queryKey: ['portfolio-valuations', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      const { data } = await supabase.from('portfolio_valuations').select('*').eq('portfolio_id', portfolioId).order('valuation_date', { ascending: false }).limit(30);
      return (data || []) as PortfolioValuationRecord[];
    },
    enabled: !!portfolioId,
  });
}

function TransactionEntryModal({ portfolio, onClose }: { portfolio: ClientPortfolio; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    transaction_type: 'buy' as string,
    symbol: '',
    quantity: '',
    price: '',
    commission: '0',
    trade_date: new Date().toISOString().split('T')[0],
    broker_name: '',
    broker_ref: '',
    notes: '',
  });

  const grossValue = (Number(form.quantity) || 0) * (Number(form.price) || 0);
  const totalFees = Number(form.commission) || 0;
  const netValue = form.transaction_type === 'buy' ? grossValue + totalFees : grossValue - totalFees;

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('portfolio_transactions').insert({
        portfolio_id: portfolio.id,
        client_id: portfolio.client_id,
        transaction_type: form.transaction_type,
        symbol: form.symbol.toUpperCase(),
        quantity: Number(form.quantity),
        price: Number(form.price),
        gross_value: grossValue,
        commission: Number(form.commission),
        exchange_fee: 0,
        cdbl_fee: 0,
        ait: 0,
        other_charges: 0,
        net_value: netValue,
        trade_date: form.trade_date,
        broker_name: form.broker_name || null,
        broker_ref: form.broker_ref || null,
        source: 'manual',
        status: 'confirmed',
        notes: form.notes || null,
        recorded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-holdings'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">Record Transaction</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
            {['buy', 'sell', 'dividend_cash', 'bonus', 'rights', 'transfer_in'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, transaction_type: t }))}
                className={cn('flex-1 py-2 text-[10px] font-semibold rounded-lg capitalize transition-all',
                  form.transaction_type === t ? (t === 'buy' ? 'bg-success text-white' : t === 'sell' ? 'bg-danger text-white' : 'bg-primary text-white') : 'text-muted hover:text-foreground'
                )}>
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Symbol *" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="e.g. BRACBANK" />
            <Input label="Trade Date *" type="date" value={form.trade_date} onChange={e => setForm(f => ({ ...f, trade_date: e.target.value }))} />
            <Input label="Quantity *" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
            <Input label="Price *" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            <Input label="Commission" type="number" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} placeholder="0" />
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">Net Value</label>
              <p className={cn('text-lg font-bold font-num', form.transaction_type === 'buy' ? 'text-danger' : 'text-success')}>
                {form.transaction_type === 'buy' ? '-' : '+'}{formatCurrency(netValue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Broker Name" value={form.broker_name} onChange={e => setForm(f => ({ ...f, broker_name: e.target.value }))} placeholder="e.g. UCB Stock" />
            <Input label="Broker Ref" value={form.broker_ref} onChange={e => setForm(f => ({ ...f, broker_ref: e.target.value }))} placeholder="Execution ID" />
          </div>

          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!form.symbol || !form.quantity || !form.price} className="flex-1">
              <Check size={16} /> Record Transaction
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

type DetailTab = 'holdings' | 'transactions' | 'valuations';

export function PortfolioManagementPage() {
  const { data: portfolios = [], isLoading } = usePortfolios();
  const [search, setSearch] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<ClientPortfolio | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('holdings');
  const [showTxnModal, setShowTxnModal] = useState(false);

  const { data: holdings = [] } = usePortfolioHoldings(selectedPortfolio?.id ?? null);
  const { data: transactions = [] } = usePortfolioTransactions(selectedPortfolio?.id ?? null);
  const { data: valuations = [] } = usePortfolioValuations(selectedPortfolio?.id ?? null);

  const stats = useMemo(() => {
    const active = portfolios.filter(p => p.status === 'active');
    return {
      totalPortfolios: active.length,
      totalClients: new Set(active.map(p => p.client_id)).size,
    };
  }, [portfolios]);

  const holdingStats = useMemo(() => {
    const totalValue = holdings.reduce((s, h) => s + h.market_value, 0);
    const totalCost = holdings.reduce((s, h) => s + h.total_cost, 0);
    const totalPL = totalValue - totalCost;
    return { totalValue, totalCost, totalPL, plPct: totalCost ? (totalPL / totalCost) * 100 : 0 };
  }, [holdings]);

  const filtered = useMemo(() => {
    if (!search) return portfolios;
    const q = search.toLowerCase();
    return portfolios.filter(p =>
      p.client_name?.toLowerCase().includes(q) ||
      p.portfolio_name.toLowerCase().includes(q) ||
      p.client_email?.toLowerCase().includes(q)
    );
  }, [portfolios, search]);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-3">
              <PieChart size={28} className="text-primary" />
              Portfolio Management
            </h1>
            <p className="text-muted text-sm mt-1">Manage client portfolios, record transactions, track performance</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="Active Portfolios" value={stats.totalPortfolios} icon={<Briefcase size={18} />} iconColor="bg-blue-50 text-blue-600" />
          <StatCard title="Total Clients" value={stats.totalClients} icon={<Users size={18} />} iconColor="bg-purple-50 text-purple-600" />
          <StatCard title="Selected AUM" value={selectedPortfolio ? formatCurrency(holdingStats.totalValue) : '—'} icon={<DollarSign size={18} />} iconColor="bg-emerald-50 text-emerald-600" />
          <StatCard title="Selected P&L" value={selectedPortfolio ? `${holdingStats.plPct >= 0 ? '+' : ''}${holdingStats.plPct.toFixed(2)}%` : '—'} icon={holdingStats.totalPL >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />} iconColor={holdingStats.totalPL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Portfolio List */}
          <div className="lg:col-span-1">
            <Card>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" placeholder="Search client or portfolio..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>

              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />) :
                 filtered.length === 0 ? <p className="text-sm text-muted text-center py-8">No portfolios found</p> :
                 filtered.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPortfolio(p); setDetailTab('holdings'); }}
                    className={cn('w-full text-left px-3 py-3 rounded-xl border transition-all',
                      selectedPortfolio?.id === p.id ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-gray-50')}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p.client_name || 'Unnamed'}</p>
                        <p className="text-[10px] text-muted">{p.portfolio_name} &middot; {p.strategy || 'Custom'}</p>
                      </div>
                      <Badge status={p.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted">
                      <span>Fee: {p.management_fee_rate}%</span>
                      <span>Since {p.inception_date}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Detail */}
          <div className="lg:col-span-2">
            {!selectedPortfolio ? (
              <Card className="flex flex-col items-center justify-center h-[500px] text-center">
                <PieChart size={40} className="text-muted/30 mb-3" />
                <p className="text-sm text-muted">Select a portfolio to manage</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Portfolio Header */}
                <Card>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold">{selectedPortfolio.client_name}</h2>
                      <p className="text-xs text-muted">{selectedPortfolio.portfolio_name} &middot; {selectedPortfolio.strategy || 'Custom'} &middot; {selectedPortfolio.risk_level || 'Moderate'}</p>
                    </div>
                    <Button size="sm" onClick={() => setShowTxnModal(true)} icon={<Plus size={14} />}>Record Transaction</Button>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-muted uppercase">Market Value</p>
                      <p className="text-base font-bold font-num">{formatCurrency(holdingStats.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">Total Cost</p>
                      <p className="text-base font-bold font-num">{formatCurrency(holdingStats.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">Unrealized P&L</p>
                      <p className={cn('text-base font-bold font-num', holdingStats.totalPL >= 0 ? 'text-success' : 'text-danger')}>
                        {holdingStats.totalPL >= 0 ? '+' : ''}{formatCurrency(holdingStats.totalPL)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">Holdings</p>
                      <p className="text-base font-bold font-num">{holdings.length}</p>
                    </div>
                  </div>
                </Card>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
                  {([
                    { id: 'holdings' as DetailTab, label: 'Holdings', icon: BarChart3 },
                    { id: 'transactions' as DetailTab, label: 'Transactions', icon: Activity },
                    { id: 'valuations' as DetailTab, label: 'NAV History', icon: TrendingUp },
                  ]).map(tab => (
                    <button key={tab.id} onClick={() => setDetailTab(tab.id)}
                      className={cn('flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all flex-1 justify-center',
                        detailTab === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground')}>
                      <tab.icon size={14} /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Holdings Tab */}
                {detailTab === 'holdings' && (
                  <Card padding={false}>
                    {holdings.length === 0 ? (
                      <p className="text-sm text-muted text-center py-12">No holdings yet. Record a buy transaction to start.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                            <th className="px-4 py-3 font-medium">Symbol</th>
                            <th className="px-4 py-3 font-medium text-right">Qty</th>
                            <th className="px-4 py-3 font-medium text-right">Avg Cost</th>
                            <th className="px-4 py-3 font-medium text-right">LTP</th>
                            <th className="px-4 py-3 font-medium text-right">Value</th>
                            <th className="px-4 py-3 font-medium text-right">P&L</th>
                            <th className="px-4 py-3 font-medium text-right">Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdings.map(h => (
                            <tr key={h.id} className="border-t border-border/30 hover:bg-gray-50">
                              <td className="px-4 py-2.5">
                                <p className="font-semibold">{h.symbol}</p>
                                <p className="text-[10px] text-muted">{h.sector || h.exchange}</p>
                              </td>
                              <td className="px-4 py-2.5 text-right font-num">{h.quantity.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right font-num">{formatCurrency(h.avg_cost)}</td>
                              <td className="px-4 py-2.5 text-right font-num">{formatCurrency(h.current_price)}</td>
                              <td className="px-4 py-2.5 text-right font-num font-medium">{formatCurrency(h.market_value)}</td>
                              <td className={cn('px-4 py-2.5 text-right font-num font-semibold', h.unrealized_pl >= 0 ? 'text-success' : 'text-danger')}>
                                {h.unrealized_pl >= 0 ? '+' : ''}{formatCurrency(h.unrealized_pl)}
                                <span className="text-[10px] ml-1">({h.unrealized_pl_pct.toFixed(1)}%)</span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-num text-muted">{h.weight_pct.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Card>
                )}

                {/* Transactions Tab */}
                {detailTab === 'transactions' && (
                  <Card padding={false}>
                    {transactions.length === 0 ? (
                      <p className="text-sm text-muted text-center py-12">No transactions recorded</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Symbol</th>
                            <th className="px-4 py-3 font-medium text-right">Qty</th>
                            <th className="px-4 py-3 font-medium text-right">Price</th>
                            <th className="px-4 py-3 font-medium text-right">Net Value</th>
                            <th className="px-4 py-3 font-medium">Source</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(t => (
                            <tr key={t.id} className="border-t border-border/30 hover:bg-gray-50">
                              <td className="px-4 py-2.5 text-xs font-num text-muted">{t.trade_date}</td>
                              <td className="px-4 py-2.5">
                                <span className={cn('text-xs font-bold uppercase px-2 py-0.5 rounded-full',
                                  t.transaction_type === 'buy' && 'bg-success/10 text-success',
                                  t.transaction_type === 'sell' && 'bg-danger/10 text-danger',
                                  !['buy', 'sell'].includes(t.transaction_type) && 'bg-info/10 text-info'
                                )}>
                                  {t.transaction_type.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-semibold">{t.symbol}</td>
                              <td className="px-4 py-2.5 text-right font-num">{t.quantity.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right font-num">{formatCurrency(t.price)}</td>
                              <td className={cn('px-4 py-2.5 text-right font-num font-medium',
                                t.transaction_type === 'buy' ? 'text-danger' : 'text-success')}>
                                {t.transaction_type === 'buy' ? '-' : '+'}{formatCurrency(t.net_value)}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted capitalize">{t.source}</td>
                              <td className="px-4 py-2.5"><Badge status={t.status} size="sm" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Card>
                )}

                {/* Valuations Tab */}
                {detailTab === 'valuations' && (
                  <Card>
                    {valuations.length === 0 ? (
                      <p className="text-sm text-muted text-center py-12">No valuation history. NAV snapshots will appear after daily valuations.</p>
                    ) : (
                      <div className="space-y-2">
                        {valuations.map(v => (
                          <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/50">
                            <div className="flex items-center gap-3">
                              <Calendar size={14} className="text-muted" />
                              <div>
                                <p className="text-xs font-semibold">{v.valuation_date}</p>
                                <p className="text-[10px] text-muted">{v.num_holdings} holdings</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold font-num">{formatCurrency(v.nav)}</p>
                              <p className={cn('text-[10px] font-num font-semibold', v.day_pl >= 0 ? 'text-success' : 'text-danger')}>
                                {v.day_pl >= 0 ? '+' : ''}{formatCurrency(v.day_pl)} ({v.day_pl_pct.toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showTxnModal && selectedPortfolio && (
        <TransactionEntryModal portfolio={selectedPortfolio} onClose={() => setShowTxnModal(false)} />
      )}
    </div>
  );
}
