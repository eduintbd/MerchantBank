import { useState } from 'react';
import { useStocks, usePlaceOrder, useOrders } from '@/hooks/useStocks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent, getChangeColor, formatDateTime, cn } from '@/lib/utils';
import { Search, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import type { Stock, OrderType } from '@/types';

export function TradingPage() {
  const [search, setSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const { data: stocks, isLoading } = useStocks(search);
  const { data: orders } = useOrders();
  const placeOrder = usePlaceOrder();

  function handleSelectStock(stock: Stock) {
    setSelectedStock(stock);
    setPrice(stock.last_price.toString());
    setQuantity('');
  }

  async function handlePlaceOrder() {
    if (!selectedStock || !quantity || !price) return;
    await placeOrder.mutateAsync({
      stock_id: selectedStock.id,
      stock_symbol: selectedStock.symbol,
      order_type: orderType,
      quantity: parseInt(quantity),
      price: parseFloat(price),
    });
    setQuantity('');
    setPrice('');
    setSelectedStock(null);
  }

  const totalAmount = quantity && price ? parseInt(quantity) * parseFloat(price) : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Trading</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Buy and sell DSE listed stocks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Stock List */}
        <div className="lg:col-span-2">
          <div className="relative mb-4 sm:mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search stocks by symbol or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs border-b border-border">
                    <th className="px-5 sm:px-6 py-3.5 font-medium">Symbol</th>
                    <th className="px-3 py-3.5 font-medium text-right">Price</th>
                    <th className="px-3 py-3.5 font-medium text-right">Change</th>
                    <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Volume</th>
                    <th className="px-3 py-3.5 font-medium text-right hidden lg:table-cell">High</th>
                    <th className="px-3 py-3.5 font-medium text-right hidden lg:table-cell">Low</th>
                    <th className="px-5 sm:px-6 py-3.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-7 h-7 border-2 border-info border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading stocks...</span>
                      </div>
                    </td></tr>
                  ) : stocks?.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">No stocks found</td></tr>
                  ) : (
                    stocks?.map(stock => (
                      <tr
                        key={stock.id}
                        className={cn(
                          'border-b border-border last:border-0 cursor-pointer transition-colors',
                          selectedStock?.id === stock.id ? 'bg-info/8' : 'hover:bg-card-hover'
                        )}
                        onClick={() => handleSelectStock(stock)}
                      >
                        <td className="px-5 sm:px-6 py-4">
                          <div className="font-medium text-foreground">{stock.symbol}</div>
                          <div className="text-xs text-muted truncate max-w-[120px] sm:max-w-[180px]">{stock.company_name}</div>
                        </td>
                        <td className="px-3 py-4 text-right font-num font-medium">{formatCurrency(stock.last_price)}</td>
                        <td className={cn('px-3 py-4 text-right font-num font-medium', getChangeColor(stock.change))}>
                          <div className="flex items-center justify-end gap-1">
                            {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {formatPercent(stock.change_percent)}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right font-num text-muted hidden md:table-cell">{stock.volume.toLocaleString()}</td>
                        <td className="px-3 py-4 text-right font-num text-muted hidden lg:table-cell">{formatCurrency(stock.high)}</td>
                        <td className="px-3 py-4 text-right font-num text-muted hidden lg:table-cell">{formatCurrency(stock.low)}</td>
                        <td className="px-5 sm:px-6 py-4">
                          <Button size="sm" variant="ghost" className="text-info" onClick={() => handleSelectStock(stock)}>Trade</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Order Panel */}
        <div className="space-y-5">
          <Card>
            <h2 className="font-semibold text-base mb-5">
              {selectedStock ? `Trade ${selectedStock.symbol}` : 'Place Order'}
            </h2>

            {!selectedStock ? (
              <div className="text-center py-12">
                <ShoppingCart size={32} className="mx-auto mb-3 text-muted" />
                <p className="text-sm text-muted">Select a stock to trade</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="flex gap-1 p-1 bg-surface rounded-xl">
                  <button
                    onClick={() => setOrderType('buy')}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
                      orderType === 'buy' ? 'bg-success text-white shadow-sm' : 'text-muted hover:text-foreground'
                    )}
                  >Buy</button>
                  <button
                    onClick={() => setOrderType('sell')}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
                      orderType === 'sell' ? 'bg-danger text-white shadow-sm' : 'text-muted hover:text-foreground'
                    )}
                  >Sell</button>
                </div>

                {/* Stock Info */}
                <div className="p-4 bg-surface rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Current Price</span>
                    <span className="font-num font-medium">{formatCurrency(selectedStock.last_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Day Range</span>
                    <span className="font-num">{formatCurrency(selectedStock.low)} - {formatCurrency(selectedStock.high)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-danger via-warning to-success mt-1" />
                </div>

                <Input label="Quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Enter quantity" min="1" />
                <Input label="Price (BDT)" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" step="0.01" />

                {totalAmount > 0 && (
                  <div className="p-4 bg-info-dim rounded-xl border border-info/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-info">Total Amount</span>
                      <span className="font-bold font-num text-info">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  variant={orderType === 'buy' ? 'success' : 'danger'}
                  onClick={handlePlaceOrder}
                  loading={placeOrder.isPending}
                  disabled={!quantity || !price}
                >
                  {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Orders */}
          <Card>
            <h3 className="font-semibold text-base mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {orders?.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{order.stock_symbol}</span>
                      <Badge status={order.order_type === 'buy' ? 'active' : 'rejected'} label={order.order_type.toUpperCase()} />
                    </div>
                    <div className="text-xs text-muted font-num mt-1">{order.quantity} @ {formatCurrency(order.price)}</div>
                  </div>
                  <div className="text-right">
                    <Badge status={order.status} />
                    <div className="text-[10px] text-muted mt-1">{formatDateTime(order.created_at)}</div>
                  </div>
                </div>
              )) || <p className="text-sm text-muted text-center py-6">No recent orders</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
