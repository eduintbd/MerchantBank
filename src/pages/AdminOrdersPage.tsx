import { useState, useMemo } from 'react';
import { usePendingOrders, useAllOrders, useExecuteOrder, useRejectOrder } from '@/hooks/useAdmin';
import { useMarketData } from '@/hooks/useMarketData';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime, formatVolume, formatValueBn, cn } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ListOrdered,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminOrdersPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const { data: pendingOrders, isLoading: loadingPending } = usePendingOrders();
  const { data: allOrders, isLoading: loadingAll } = useAllOrders();
  const { data: market } = useMarketData();
  const executeOrder = useExecuteOrder();
  const rejectOrder = useRejectOrder();

  const orders = tab === 'pending' ? pendingOrders : allOrders;
  const isLoading = tab === 'pending' ? loadingPending : loadingAll;

  // Compute admin analytics
  const analytics = useMemo(() => {
    const all = allOrders || [];
    const pending = pendingOrders || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = all.filter(o => o.created_at?.startsWith(todayStr));

    const totalBuyValue = all
      .filter(o => o.order_type === 'buy' && o.status === 'executed')
      .reduce((sum, o) => sum + o.total_amount, 0);
    const totalSellValue = all
      .filter(o => o.order_type === 'sell' && o.status === 'executed')
      .reduce((sum, o) => sum + o.total_amount, 0);

    const uniqueUsers = new Set(all.map(o => o.user_id)).size;
    const executedCount = all.filter(o => o.status === 'executed').length;
    const rejectedCount = all.filter(o => o.status === 'rejected').length;

    // Top traded symbols
    const symbolCounts = new Map<string, { count: number; value: number }>();
    for (const o of all) {
      const existing = symbolCounts.get(o.stock_symbol) || { count: 0, value: 0 };
      existing.count++;
      existing.value += o.total_amount;
      symbolCounts.set(o.stock_symbol, existing);
    }
    const topSymbols = [...symbolCounts.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5);

    return {
      pendingCount: pending.length,
      todayCount: todayOrders.length,
      totalBuyValue,
      totalSellValue,
      uniqueUsers,
      executedCount,
      rejectedCount,
      totalOrders: all.length,
      topSymbols,
    };
  }, [allOrders, pendingOrders]);

  // Market status
  const lastUpdate = market?.lastUpdated ? new Date(market.lastUpdated) : null;
  const isMarketOpen = lastUpdate ? (Date.now() - lastUpdate.getTime()) / 60000 < 10 : false;

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="space-y-6 sm:space-y-8 px-3 sm:px-6 lg:px-8 py-4 sm:py-6" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldCheck size={28} className="text-info" />
            Admin Terminal
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-muted text-sm">Order management & market analytics</p>
            <span className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border',
              isMarketOpen
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-danger/30 bg-danger/10 text-danger'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isMarketOpen ? 'bg-success animate-pulse' : 'bg-danger')} />
              DSE {isMarketOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>
        {analytics.pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/10 border border-warning/30 animate-pulse">
            <AlertTriangle size={16} className="text-warning" />
            <span className="text-sm font-bold text-warning font-num">{analytics.pendingCount}</span>
            <span className="text-xs text-warning/80">pending</span>
          </div>
        )}
      </div>

      {/* ========== STATS GRID ========== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Pending Orders"
          value={analytics.pendingCount}
          icon={<Clock size={18} />}
          iconColor="bg-warning/15 text-warning"
          gradient="grad-warning"
        />
        <StatCard
          title="Today's Orders"
          value={analytics.todayCount}
          icon={<ShoppingCart size={18} />}
          iconColor="bg-info/15 text-info"
          gradient="grad-info"
        />
        <StatCard
          title="Buy Volume"
          value={formatCurrency(analytics.totalBuyValue)}
          icon={<TrendingUp size={18} />}
          iconColor="bg-success/15 text-success"
          gradient="grad-success"
        />
        <StatCard
          title="Sell Volume"
          value={formatCurrency(analytics.totalSellValue)}
          icon={<TrendingDown size={18} />}
          iconColor="bg-danger/15 text-danger"
          gradient="grad-danger"
        />
      </div>

      {/* ========== SECONDARY STATS + TOP SYMBOLS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Order flow stats */}
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-info" />
            Order Flow
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Total Orders</span>
              <span className="font-bold font-num text-foreground">{analytics.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Executed</span>
              <span className="font-bold font-num text-success">{analytics.executedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Rejected</span>
              <span className="font-bold font-num text-danger">{analytics.rejectedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Active Users</span>
              <span className="font-bold font-num text-foreground flex items-center gap-1">
                <Users size={12} className="text-info" />
                {analytics.uniqueUsers}
              </span>
            </div>

            {/* Execution ratio bar */}
            {analytics.totalOrders > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted mb-1">
                  <span>Execution Rate</span>
                  <span className="font-num font-bold text-success">
                    {((analytics.executedCount / analytics.totalOrders) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-border/40">
                  <div
                    className="bg-success rounded-full transition-all duration-500"
                    style={{ width: `${(analytics.executedCount / analytics.totalOrders) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Top traded symbols */}
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <DollarSign size={14} className="text-warning" />
            Top Traded Symbols
          </h3>
          <div className="space-y-2">
            {analytics.topSymbols.map(([symbol, data], i) => (
              <div key={symbol} className="flex items-center gap-3 py-1.5">
                <span className="text-[10px] text-muted font-num w-4">{i + 1}</span>
                <span className="font-semibold text-foreground text-xs flex-1">{symbol}</span>
                <span className="text-[10px] text-muted font-num">{data.count} orders</span>
                <span className="text-xs font-bold font-num text-foreground">{formatCurrency(data.value)}</span>
              </div>
            ))}
            {analytics.topSymbols.length === 0 && (
              <p className="text-xs text-muted text-center py-4">No trade data yet</p>
            )}
          </div>
        </Card>

        {/* Market snapshot */}
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity size={14} className="text-success" />
            Market Snapshot
          </h3>
          {market ? (
            <div className="space-y-3">
              {market.indices.map(idx => (
                <div key={idx.index_name} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">{idx.index_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-num text-foreground text-sm">
                      {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(
                      'text-[10px] font-bold font-num px-1.5 py-0.5 rounded',
                      idx.change >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    )}>
                      {idx.change >= 0 ? '+' : ''}{idx.change_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Volume</span>
                  <span className="font-num font-bold text-foreground">{formatVolume(market.stats.totalVolume)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Value</span>
                  <span className="font-num font-bold text-foreground">{formatValueBn(market.stats.totalValue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Adv / Dec</span>
                  <span>
                    <span className="font-num font-bold text-success">{market.stats.advancers}</span>
                    <span className="text-muted mx-1">/</span>
                    <span className="font-num font-bold text-danger">{market.stats.decliners}</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="skeleton h-[140px] rounded-xl" />
          )}
        </Card>
      </div>

      {/* ========== ORDERS TABLE ========== */}
      <div>
        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1 p-1 bg-surface rounded-xl">
            <button
              onClick={() => setTab('pending')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                tab === 'pending' ? 'bg-warning text-white shadow-sm' : 'text-muted hover:text-foreground'
              )}
            >
              <Clock size={14} />
              Pending ({pendingOrders?.length || 0})
            </button>
            <button
              onClick={() => setTab('all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                tab === 'all' ? 'bg-info text-white shadow-sm' : 'text-muted hover:text-foreground'
              )}
            >
              <ListOrdered size={14} />
              All Orders
            </button>
          </div>
          <span className="text-[10px] text-muted font-num">Auto-refresh 10s</span>
        </div>

        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] text-muted uppercase tracking-wider border-b border-border bg-gray-50/80">
                  <th className="px-4 sm:px-5 py-3 font-medium">Investor</th>
                  <th className="px-3 py-3 font-medium">Stock</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium text-right">Qty</th>
                  <th className="px-3 py-3 font-medium text-right">Price</th>
                  <th className="px-3 py-3 font-medium text-right hidden sm:table-cell">Total</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium hidden sm:table-cell">Date</th>
                  {tab === 'pending' && <th className="px-4 sm:px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-info border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted text-xs">
                      {tab === 'pending' ? 'No pending orders' : 'No orders yet'}
                    </td>
                  </tr>
                ) : (
                  orders?.map((order, i) => (
                    <tr
                      key={order.id}
                      className={cn(
                        'border-b border-border/30 last:border-0 hover:bg-gray-50/50 transition-colors',
                        tab === 'pending' && 'bg-warning/[0.02]'
                      )}
                    >
                      <td className="px-4 sm:px-5 py-3">
                        <div className="font-medium text-foreground text-[11px]">{order.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-[10px] text-muted truncate max-w-[120px]">{order.profiles?.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-foreground">{order.stock_symbol}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold',
                          order.order_type === 'buy' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                        )}>
                          {order.order_type === 'buy' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {order.order_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-num font-medium text-foreground">{order.quantity}</td>
                      <td className="px-3 py-3 text-right font-num text-foreground">{formatCurrency(order.price)}</td>
                      <td className="px-3 py-3 text-right font-num font-bold text-foreground hidden sm:table-cell">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-3 py-3"><Badge status={order.status} /></td>
                      <td className="px-3 py-3 text-[10px] text-muted hidden sm:table-cell">{formatDateTime(order.created_at)}</td>
                      {tab === 'pending' && (
                        <td className="px-4 sm:px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => executeOrder.mutate(order.id, {
                                onSuccess: () => toast.success('Order approved', { description: `${order.stock_symbol} ${order.order_type} executed` }),
                                onError: (err: any) => toast.error('Failed', { description: err?.message }),
                              })}
                              loading={executeOrder.isPending}
                              icon={<CheckCircle size={12} />}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => rejectOrder.mutate(order.id, {
                                onSuccess: () => toast.success('Order rejected'),
                                onError: (err: any) => toast.error('Failed', { description: err?.message }),
                              })}
                              loading={rejectOrder.isPending}
                              icon={<XCircle size={12} />}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
