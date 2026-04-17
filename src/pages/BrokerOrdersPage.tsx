import { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { BrokerOrder, BrokerExecution, BrokerConnection } from '@/types';
import {
  ArrowRightLeft,
  ListOrdered,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Wifi,
  WifiOff,
  Upload,
  Zap,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// Data hooks
// ============================================================

function useBrokerOrders() {
  return useQuery({
    queryKey: ['broker-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_orders')
        .select('*, profiles:client_id(full_name), broker_connections:broker_id(broker_name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((o: any) => ({
        ...o,
        client_name: o.profiles?.full_name ?? 'Unknown',
        broker_name: o.broker_connections?.broker_name ?? '—',
      })) as BrokerOrder[];
    },
    refetchInterval: 10_000,
  });
}

function useBrokerExecutions(orderId: string | null) {
  return useQuery({
    queryKey: ['broker-executions', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_executions')
        .select('*')
        .eq('abaci_order_id', orderId!)
        .order('received_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BrokerExecution[];
    },
  });
}

function useBrokerConnections() {
  return useQuery({
    queryKey: ['broker-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_connections')
        .select('*')
        .order('broker_name');
      if (error) throw error;
      return (data || []) as BrokerConnection[];
    },
  });
}

function useClients() {
  return useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================================
// Status helpers
// ============================================================

type StatusFilter = 'all' | 'open' | 'filled' | 'rejected';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/5 text-muted border border-border',
  SUBMITTED: 'bg-info-dim text-info border border-info/20',
  ACCEPTED: 'bg-info-dim text-info border border-info/20',
  OPEN: 'bg-info-dim text-info border border-info/20',
  PARTIALLY_FILLED: 'bg-warning-dim text-warning border border-warning/20',
  FILLED: 'bg-success-dim text-success border border-success/20',
  CANCELLED: 'bg-white/5 text-muted border border-border',
  EXPIRED: 'bg-white/5 text-muted border border-border',
  REJECTED: 'bg-danger-dim text-danger border border-danger/20',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[status] || 'bg-white/5 text-muted border border-border')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function isOpenStatus(s: string) {
  return ['DRAFT', 'SUBMITTED', 'ACCEPTED', 'OPEN', 'PARTIALLY_FILLED'].includes(s);
}

// ============================================================
// New Order Modal
// ============================================================

interface OrderFormState {
  broker_id: string;
  client_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: string;
  limit_price: string;
  board: 'PUBLIC' | 'BLOCK' | 'SPOT';
}

const INITIAL_FORM: OrderFormState = {
  broker_id: '',
  client_id: '',
  symbol: '',
  side: 'BUY',
  order_type: 'LIMIT',
  quantity: '',
  limit_price: '',
  board: 'PUBLIC',
};

function NewOrderModal({ onClose, brokers, clients }: {
  onClose: () => void;
  brokers: BrokerConnection[];
  clients: { id: string; full_name: string; email: string }[];
}) {
  const [form, setForm] = useState<OrderFormState>(INITIAL_FORM);
  const qc = useQueryClient();

  const createOrder = useMutation({
    mutationFn: async () => {
      const qty = parseInt(form.quantity, 10);
      const lp = form.limit_price ? parseFloat(form.limit_price) : null;
      if (!form.broker_id || !form.client_id || !form.symbol || !qty) throw new Error('Fill all required fields');

      const { error } = await supabase.from('broker_orders').insert({
        broker_id: form.broker_id,
        client_id: form.client_id,
        symbol: form.symbol.toUpperCase().trim(),
        exchange: 'DSE',
        side: form.side,
        order_type: form.order_type,
        quantity: qty,
        limit_price: lp,
        time_in_force: 'DAY',
        board: form.board,
        status: 'DRAFT',
        filled_qty: 0,
        avg_fill_price: 0,
        remaining_qty: qty,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order created as DRAFT');
      qc.invalidateQueries({ queryKey: ['broker-orders'] });
      onClose();
    },
    onError: (err: any) => toast.error('Failed', { description: err?.message }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Plus size={16} className="text-info" />
            New Broker Order
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Side toggle */}
          <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
            {(['BUY', 'SELL'] as const).map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, side: s }))}
                className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                  form.side === s ? (s === 'BUY' ? 'bg-success text-white' : 'bg-danger text-white') : 'text-muted hover:text-foreground'
                )}>
                {s}
              </button>
            ))}
          </div>

          {/* Broker */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">Broker *</label>
            <select value={form.broker_id} onChange={e => setForm(f => ({ ...f, broker_id: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select broker...</option>
              {brokers.map(b => <option key={b.id} value={b.id}>{b.broker_name} ({b.broker_code})</option>)}
            </select>
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">Client *</label>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Symbol *" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="e.g. BRACBANK" />
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">Order Type *</label>
              <select value={form.order_type} onChange={e => setForm(f => ({ ...f, order_type: e.target.value as any }))}
                className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="LIMIT">LIMIT</option>
                <option value="MARKET">MARKET</option>
              </select>
            </div>
            <Input label="Quantity *" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
            <Input label="Limit Price" type="number" value={form.limit_price} onChange={e => setForm(f => ({ ...f, limit_price: e.target.value }))} placeholder="0.00" disabled={form.order_type === 'MARKET'} />
          </div>

          {/* Board */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">Board</label>
            <div className="flex gap-2">
              {(['PUBLIC', 'BLOCK', 'SPOT'] as const).map(b => (
                <button key={b} onClick={() => setForm(f => ({ ...f, board: b }))}
                  className={cn('px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all',
                    form.board === b ? 'bg-info text-white border-info' : 'border-border text-muted hover:text-foreground'
                  )}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={() => createOrder.mutate()} loading={createOrder.isPending} icon={<Plus size={14} />}>
              Create Draft
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// Executions inline panel
// ============================================================

function ExecutionsPanel({ orderId }: { orderId: string }) {
  const { data: execs, isLoading } = useBrokerExecutions(orderId);

  if (isLoading) return (
    <tr><td colSpan={12} className="px-8 py-3 bg-gray-50/50">
      <div className="flex items-center gap-2 text-xs text-muted"><div className="w-4 h-4 border-2 border-info border-t-transparent rounded-full animate-spin" /> Loading fills...</div>
    </td></tr>
  );

  if (!execs?.length) return (
    <tr><td colSpan={12} className="px-8 py-3 bg-gray-50/50 text-xs text-muted">No executions yet</td></tr>
  );

  return (
    <>
      <tr><td colSpan={12} className="px-0 py-0">
        <div className="bg-gray-50/80 border-t border-b border-border/30 px-8 py-2">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Fills / Executions</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-muted uppercase tracking-wider">
                <th className="text-left py-1 font-medium">Exec ID</th>
                <th className="text-left py-1 font-medium">Type</th>
                <th className="text-right py-1 font-medium">Qty</th>
                <th className="text-right py-1 font-medium">Price</th>
                <th className="text-right py-1 font-medium">Net Value</th>
                <th className="text-left py-1 font-medium">Source</th>
                <th className="text-left py-1 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {execs.map(e => (
                <tr key={e.id} className="border-t border-border/20">
                  <td className="py-1.5 font-num text-[10px] text-muted">{e.exec_id.slice(0, 12)}...</td>
                  <td className="py-1.5">
                    <span className={cn('text-[10px] font-bold', e.exec_type === 'FILL' || e.exec_type === 'PARTIAL_FILL' ? 'text-success' : 'text-danger')}>
                      {e.exec_type}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-num font-medium">{e.exec_qty}</td>
                  <td className="py-1.5 text-right font-num">{formatCurrency(e.exec_price)}</td>
                  <td className="py-1.5 text-right font-num font-bold">{formatCurrency(e.net_value)}</td>
                  <td className="py-1.5 text-[10px] text-muted">{e.source}</td>
                  <td className="py-1.5 text-[10px] text-muted">{e.exec_time ?? formatDateTime(e.received_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td></tr>
    </>
  );
}

// ============================================================
// Main Page
// ============================================================

export function BrokerOrdersPage() {
  const [tab, setTab] = useState<'orders' | 'connections'>('orders');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const { data: orders, isLoading: loadingOrders } = useBrokerOrders();
  const { data: brokers } = useBrokerConnections();
  const { data: clients } = useClients();

  // Stats
  const stats = useMemo(() => {
    const all = orders || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const today = all.filter(o => o.created_at?.startsWith(todayStr));
    return {
      todayCount: today.length,
      openCount: all.filter(o => isOpenStatus(o.status)).length,
      filledCount: all.filter(o => o.status === 'FILLED').length,
      rejectedCount: all.filter(o => o.status === 'REJECTED').length,
    };
  }, [orders]);

  // Filtered orders
  const filtered = useMemo(() => {
    let list = orders || [];
    if (filter === 'open') list = list.filter(o => isOpenStatus(o.status));
    else if (filter === 'filled') list = list.filter(o => o.status === 'FILLED');
    else if (filter === 'rejected') list = list.filter(o => o.status === 'REJECTED');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => o.symbol.toLowerCase().includes(q) || (o.client_name || '').toLowerCase().includes(q));
    }
    return list;
  }, [orders, filter, search]);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="space-y-6 sm:space-y-8 px-3 sm:px-6 lg:px-8 py-4 sm:py-6" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ========== HEADER ========== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
              <ArrowRightLeft size={28} className="text-info" />
              Broker Order Routing
            </h1>
            <p className="text-muted text-sm mt-1.5">Submit orders, track fills, manage broker connections</p>
          </div>
          {tab === 'orders' && (
            <Button onClick={() => setShowNewOrder(true)} icon={<Plus size={14} />}>
              New Order
            </Button>
          )}
        </div>

        {/* ========== STATS ========== */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Orders Today"
            value={stats.todayCount}
            icon={<ListOrdered size={18} />}
            iconColor="bg-info/15 text-info"
            gradient="grad-info"
          />
          <StatCard
            title="Open Orders"
            value={stats.openCount}
            icon={<Clock size={18} />}
            iconColor="bg-warning/15 text-warning"
            gradient="grad-warning"
          />
          <StatCard
            title="Filled"
            value={stats.filledCount}
            icon={<CheckCircle size={18} />}
            iconColor="bg-success/15 text-success"
            gradient="grad-success"
          />
          <StatCard
            title="Rejected"
            value={stats.rejectedCount}
            icon={<XCircle size={18} />}
            iconColor="bg-danger/15 text-danger"
            gradient="grad-danger"
          />
        </div>

        {/* ========== TABS ========== */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-surface rounded-xl">
            <button onClick={() => setTab('orders')}
              className={cn('flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                tab === 'orders' ? 'bg-info text-white shadow-sm' : 'text-muted hover:text-foreground')}>
              <ListOrdered size={14} />
              Orders
            </button>
            <button onClick={() => setTab('connections')}
              className={cn('flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                tab === 'connections' ? 'bg-info text-white shadow-sm' : 'text-muted hover:text-foreground')}>
              <Server size={14} />
              Broker Connections
            </button>
          </div>
        </div>

        {/* ========== ORDERS TAB ========== */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'open', label: 'Open' },
                  { key: 'filled', label: 'Filled' },
                  { key: 'rejected', label: 'Rejected' },
                ] as const).map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                      filter === f.key ? 'bg-white shadow-sm text-foreground' : 'text-muted hover:text-foreground')}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-[200px] max-w-xs">
                <Input placeholder="Search symbol or client..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
              </div>
              <span className="text-[10px] text-muted font-num ml-auto">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] text-muted uppercase tracking-wider border-b border-border bg-gray-50/80">
                      <th className="px-4 py-3 font-medium w-6"></th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Symbol</th>
                      <th className="px-3 py-3 font-medium">Side</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium text-right">Qty</th>
                      <th className="px-3 py-3 font-medium text-right">Limit</th>
                      <th className="px-3 py-3 font-medium text-right">Progress</th>
                      <th className="px-3 py-3 font-medium text-right">Avg Fill</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium hidden lg:table-cell">Broker</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr><td colSpan={12} className="px-5 py-10 text-center text-muted">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-info border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">Loading orders...</span>
                        </div>
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={12} className="px-5 py-10 text-center text-muted text-xs">No orders found</td></tr>
                    ) : (
                      filtered.map(order => {
                        const isExpanded = expandedId === order.id;
                        const fillPct = order.quantity > 0 ? Math.round((order.filled_qty / order.quantity) * 100) : 0;
                        return (
                          <Fragment key={order.id}>
                            <tr
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              className={cn(
                                'border-b border-border/30 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer',
                                isExpanded && 'bg-gray-50/50'
                              )}
                            >
                              <td className="px-4 py-3 text-muted">
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </td>
                              <td className="px-3 py-3 text-[10px] text-muted whitespace-nowrap">{formatDateTime(order.created_at)}</td>
                              <td className="px-3 py-3 font-semibold text-foreground">{order.symbol}</td>
                              <td className="px-3 py-3">
                                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold',
                                  order.side === 'BUY' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger')}>
                                  {order.side === 'BUY' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  {order.side}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-muted">{order.order_type}</td>
                              <td className="px-3 py-3 text-right font-num font-medium text-foreground">{order.quantity.toLocaleString()}</td>
                              <td className="px-3 py-3 text-right font-num text-foreground">{order.limit_price ? formatCurrency(order.limit_price) : '—'}</td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-border/40 overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all', fillPct >= 100 ? 'bg-success' : fillPct > 0 ? 'bg-warning' : 'bg-border/60')} style={{ width: `${fillPct}%` }} />
                                  </div>
                                  <span className="font-num text-[10px] text-muted w-12 text-right">{order.filled_qty}/{order.quantity}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right font-num text-foreground">{order.avg_fill_price > 0 ? formatCurrency(order.avg_fill_price) : '—'}</td>
                              <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                              <td className="px-3 py-3 text-muted hidden lg:table-cell">{order.broker_name}</td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-foreground text-[11px] font-medium">{order.client_name}</span>
                              </td>
                            </tr>
                            {isExpanded && <ExecutionsPanel orderId={order.id} />}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========== BROKER CONNECTIONS TAB ========== */}
        {tab === 'connections' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokers?.length === 0 && (
              <p className="text-sm text-muted col-span-full text-center py-10">No broker connections configured</p>
            )}
            {brokers?.map(b => {
              const isActive = b.status === 'active';
              const heartbeatAge = b.last_heartbeat
                ? Math.round((Date.now() - new Date(b.last_heartbeat).getTime()) / 60_000)
                : null;
              return (
                <Card key={b.id} hover>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{b.broker_name}</h3>
                      <p className="text-[10px] text-muted font-num">{b.broker_code}</p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                      isActive
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-border bg-gray-50 text-muted'
                    )}>
                      {isActive ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {b.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {b.api_base_url && (
                      <div className="flex justify-between">
                        <span className="text-muted">API URL</span>
                        <span className="font-num text-foreground truncate max-w-[180px]">{b.api_base_url}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted">Auth</span>
                      <span className="text-foreground">{b.auth_method}</span>
                    </div>
                    {heartbeatAge !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted">Last Heartbeat</span>
                        <span className={cn('font-num', heartbeatAge > 10 ? 'text-danger' : 'text-success')}>
                          {heartbeatAge < 1 ? '< 1 min ago' : `${heartbeatAge}m ago`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-border/40">
                    {b.supports_realtime && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-info/10 text-info">
                        <Zap size={9} /> Realtime
                      </span>
                    )}
                    {b.supports_file_upload && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning">
                        <Upload size={9} /> File Upload
                      </span>
                    )}
                    {b.supports_websocket && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success">
                        <Wifi size={9} /> WebSocket
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== NEW ORDER MODAL ========== */}
      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          brokers={brokers || []}
          clients={clients || []}
        />
      )}
    </div>
  );
}
