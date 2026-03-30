import { X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn, formatCurrency, formatDateTime, getChangeColor } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExplainThis } from '@/components/ui/ExplainThis';
import { useDemoPortfolio } from '@/hooks/useDemoPortfolio';
import { useDemoOrders } from '@/hooks/useDemoOrders';
import type { DemoOrder } from '@/types/demo';

interface DemoPositionDetailProps {
  symbol: string;
  onClose: () => void;
}

export function DemoPositionDetail({ symbol, onClose }: DemoPositionDetailProps) {
  const { data: positions } = useDemoPortfolio();
  const { data: allOrders } = useDemoOrders();

  const position = (positions || []).find((p) => p.symbol === symbol);
  const symbolOrders = (allOrders || []).filter((o: DemoOrder) => o.symbol === symbol);

  if (!position) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <Card className="w-full max-w-lg relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No position found for {symbol}.</p>
          </div>
        </Card>
      </div>
    );
  }

  const grossValue = Number(position.quantity) * Number(position.market_price);
  const costBasis = Number(position.quantity) * Number(position.avg_cost);
  const unrealizedPnl = Number(position.unrealized_pnl);
  const realizedPnl = Number(position.realized_pnl);
  const totalPnl = unrealizedPnl + realizedPnl;
  const pnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{position.symbol}</h2>
          {position.company_name && (
            <p className="text-xs text-gray-500">{position.company_name}</p>
          )}
        </div>

        {/* Position metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantity</p>
            <p className="text-base font-bold font-num text-gray-900 mt-0.5">{position.quantity}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Avg Cost</p>
            <p className="text-base font-bold font-num text-gray-900 mt-0.5">{formatCurrency(position.avg_cost)}</p>
            <ExplainThis
              title="Average Cost"
              explanation="The weighted average price at which you purchased these shares. It is calculated by dividing your total cost basis by the number of shares held."
            />
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Market Price</p>
            <p className="text-base font-bold font-num text-gray-900 mt-0.5">{formatCurrency(position.market_price)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Market Value</p>
            <p className="text-base font-bold font-num text-gray-900 mt-0.5">{formatCurrency(grossValue)}</p>
          </div>
        </div>

        {/* P&L breakdown */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">Profit & Loss</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className={cn('w-3.5 h-3.5', getChangeColor(unrealizedPnl))} />
                <span className="text-xs text-gray-600">Unrealized P&L</span>
              </div>
              <span className={cn('text-xs font-semibold font-num', getChangeColor(unrealizedPnl))}>
                {formatCurrency(unrealizedPnl)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingDown className={cn('w-3.5 h-3.5', getChangeColor(realizedPnl))} />
                <span className="text-xs text-gray-600">Realized P&L</span>
              </div>
              <span className={cn('text-xs font-semibold font-num', getChangeColor(realizedPnl))}>
                {formatCurrency(realizedPnl)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-600">Cost Basis</span>
              <span className="text-xs font-semibold font-num text-gray-900">
                {formatCurrency(costBasis)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-semibold text-gray-900">Total P&L</span>
              <span className={cn('text-sm font-bold font-num', getChangeColor(totalPnl))}>
                {formatCurrency(totalPnl)}
              </span>
            </div>
          </div>

          <ExplainThis
            title="Gross vs Net P&L"
            explanation="Gross P&L is the difference between your sell price and buy price multiplied by quantity. Net P&L subtracts all trading charges (brokerage, CDBL, BSEC fees, and AIT). Always look at net P&L for your true profit."
            lessonLink="/learning"
          />
        </div>

        {/* Trade history for this symbol */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-3">Trade History</h3>
          {symbolOrders.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No orders found for {symbol}.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {symbolOrders.map((order: DemoOrder) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      status={order.side === 'BUY' ? 'active' : 'rejected'}
                      label={order.side}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-900">
                        {order.quantity} shares @ {order.avg_fill_price > 0
                          ? formatCurrency(order.avg_fill_price)
                          : order.order_type === 'LIMIT' && order.limit_price
                            ? formatCurrency(order.limit_price)
                            : 'Market'}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDateTime(order.created_at)}
                      </div>
                    </div>
                  </div>
                  <Badge status={order.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
