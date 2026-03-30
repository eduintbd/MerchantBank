import { useState } from 'react';
import { Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrderStatusExplainer } from '@/components/trading/OrderStatusExplainer';
import { useDemoOrders, useCancelDemoOrder } from '@/hooks/useDemoOrders';
import type { DemoOrder } from '@/types/demo';

export function DemoOpenOrders() {
  const { data: orders, isLoading } = useDemoOrders();
  const cancelOrder = useCancelDemoOrder();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success('Order cancelled successfully');
    } catch (err: any) {
      toast.error('Failed to cancel order', { description: err?.message });
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  const allOrders = orders || [];

  if (allOrders.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No orders found.</p>
          <p className="text-xs text-gray-400 mt-1">Place your first order to see it here.</p>
        </div>
      </Card>
    );
  }

  const openStatuses = new Set(['submitted', 'queued', 'partially_filled', 'draft']);

  return (
    <Card padding={false}>
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Demo Orders</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {allOrders.length} total order{allOrders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Orders list */}
      <div className="divide-y divide-gray-100">
        {allOrders.map((order: DemoOrder) => {
          const isOpen = openStatuses.has(order.status);
          const isExpanded = expandedId === order.id;

          return (
            <div key={order.id} className="group">
              <div
                className={cn(
                  'flex items-center justify-between px-4 sm:px-5 py-3 cursor-pointer',
                  'hover:bg-gray-50/50 transition-colors'
                )}
                onClick={() => toggleExpand(order.id)}
              >
                {/* Left: symbol + details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Badge
                    status={order.side === 'BUY' ? 'active' : 'rejected'}
                    label={order.side}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{order.symbol}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{order.order_type}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-num">
                      {order.quantity} shares
                      {order.order_type === 'LIMIT' && order.limit_price
                        ? ` @ ${formatCurrency(order.limit_price)}`
                        : ' @ Market'}
                    </p>
                  </div>
                </div>

                {/* Right: status + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <Badge status={order.status} size="sm" />
                    {order.status === 'filled' && order.avg_fill_price > 0 && (
                      <p className="text-[10px] text-gray-500 font-num mt-0.5">
                        Filled @ {formatCurrency(order.avg_fill_price)}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 font-num mt-0.5">
                      {order.submitted_at
                        ? formatDateTime(order.submitted_at)
                        : formatDateTime(order.created_at)}
                    </p>
                  </div>

                  {isOpen && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(order.id);
                      }}
                      loading={cancelOrder.isPending}
                      icon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Cancel
                    </Button>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded: Order Status Explanation */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-3">
                  <OrderStatusExplainer order={order} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
