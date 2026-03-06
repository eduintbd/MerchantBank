import { useState } from 'react';
import { usePendingOrders, useAllOrders, useExecuteOrder, useRejectOrder } from '@/hooks/useAdmin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { ShieldCheck, CheckCircle, XCircle, Clock, ListOrdered } from 'lucide-react';

export function AdminOrdersPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const { data: pendingOrders, isLoading: loadingPending } = usePendingOrders();
  const { data: allOrders, isLoading: loadingAll } = useAllOrders();
  const executeOrder = useExecuteOrder();
  const rejectOrder = useRejectOrder();

  const orders = tab === 'pending' ? pendingOrders : allOrders;
  const isLoading = tab === 'pending' ? loadingPending : loadingAll;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck size={28} className="text-info" />
          Order Management
        </h1>
        <p className="text-muted text-sm sm:text-base mt-1">Review and approve investor orders</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit mb-6">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all',
            tab === 'pending' ? 'bg-warning text-white shadow-sm' : 'text-muted hover:text-foreground'
          )}
        >
          <Clock size={16} />
          Pending ({pendingOrders?.length || 0})
        </button>
        <button
          onClick={() => setTab('all')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all',
            tab === 'all' ? 'bg-info text-white shadow-sm' : 'text-muted hover:text-foreground'
          )}
        >
          <ListOrdered size={16} />
          All Orders
        </button>
      </div>

      {/* Orders Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-border">
                <th className="px-5 sm:px-6 py-3.5 font-medium">Investor</th>
                <th className="px-3 py-3.5 font-medium">Stock</th>
                <th className="px-3 py-3.5 font-medium">Type</th>
                <th className="px-3 py-3.5 font-medium text-right">Qty</th>
                <th className="px-3 py-3.5 font-medium text-right">Price</th>
                <th className="px-3 py-3.5 font-medium text-right hidden sm:table-cell">Total</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-3 py-3.5 font-medium hidden sm:table-cell">Date</th>
                {tab === 'pending' && <th className="px-5 sm:px-6 py-3.5 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-2 border-info border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-muted">
                    {tab === 'pending' ? 'No pending orders' : 'No orders yet'}
                  </td>
                </tr>
              ) : (
                orders?.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                    <td className="px-5 sm:px-6 py-4">
                      <div className="font-medium">{order.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-muted">{order.profiles?.email}</div>
                    </td>
                    <td className="px-3 py-4 font-medium">{order.stock_symbol}</td>
                    <td className="px-3 py-4">
                      <Badge
                        status={order.order_type === 'buy' ? 'active' : 'rejected'}
                        label={order.order_type.toUpperCase()}
                      />
                    </td>
                    <td className="px-3 py-4 text-right font-num">{order.quantity}</td>
                    <td className="px-3 py-4 text-right font-num">{formatCurrency(order.price)}</td>
                    <td className="px-3 py-4 text-right font-num font-medium hidden sm:table-cell">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-3 py-4"><Badge status={order.status} /></td>
                    <td className="px-3 py-4 text-muted hidden sm:table-cell">{formatDateTime(order.created_at)}</td>
                    {tab === 'pending' && (
                      <td className="px-5 sm:px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => executeOrder.mutate(order.id)}
                            loading={executeOrder.isPending}
                            icon={<CheckCircle size={14} />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => rejectOrder.mutate(order.id)}
                            loading={rejectOrder.isPending}
                            icon={<XCircle size={14} />}
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
  );
}
