import { useState, useMemo } from 'react';
import { useStocks, usePlaceOrder, useOrders } from '@/hooks/useStocks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ExchangeToggle, type ExchangeFilter } from '@/components/ui/ExchangeToggle';
import { formatCurrency, formatPercent, getChangeColor, formatDateTime, cn } from '@/lib/utils';
import { Search, TrendingUp, TrendingDown, ShoppingCart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Stock, OrderType } from '@/types';

export function TradingPage() {
  const [search, setSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter>('ALL');

  const { data: allStocks, isLoading } = useStocks(search);
  const { data: orders } = useOrders();
  const placeOrder = usePlaceOrder();

  const stocks = useMemo(() => {
    if (!allStocks) return [];
    if (exchangeFilter === 'ALL') return allStocks;
    return allStocks.filter(s => s.exchange === exchangeFilter);
  }, [allStocks, exchangeFilter]);

  function handleSelectStock(stock: Stock) {
    setSelectedStock(stock);
    setPrice(stock.last_price.toString());
    setQuantity('');
  }

  async function handlePlaceOrder() {
    if (!selectedStock || !quantity || !price) return;
    try {
      await placeOrder.mutateAsync({
        stock_symbol: selectedStock.symbol,
        order_type: orderType,
        quantity: parseInt(quantity),
        price: parseFloat(price),
      });
      toast.success(`${orderType.toUpperCase()} order placed`, {
        description: `${parseInt(quantity)} x ${selectedStock.symbol} @ ৳${parseFloat(price).toFixed(2)}`,
      });
      setQuantity('');
      setPrice('');
      setSelectedStock(null);
    } catch (err: any) {
      toast.error('Order failed', { description: err?.message || 'Please try again' });
    }
  }

  const totalAmount = quantity && price ? parseInt(quantity) * parseFloat(price) : 0;

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Trading Terminal</h1>
            <p className="text-muted text-sm sm:text-base mt-1">Buy and sell DSE & CSE listed stocks in real time</p>
          </div>
          <ExchangeToggle value={exchangeFilter} onChange={setExchangeFilter} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Stock List */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="relative mb-5 sm:mb-6">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by symbol or company name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 shadow-[var(--shadow-card)] transition-all"
            />
          </div>

          <Card padding={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border bg-gray-50/80">
                    <th className="px-5 sm:px-6 py-3.5 font-medium">Symbol</th>
                    <th className="px-3 py-3.5 font-medium text-right">Price</th>
                    <th className="px-3 py-3.5 font-medium text-right">Change</th>
                    <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Volume</th>
                    <th className="px-3 py-3.5 font-medium text-right hidden lg:table-cell">Open</th>
                    <th className="px-3 py-3.5 font-medium text-right hidden lg:table-cell">High</th>
                    <th className="px-3 py-3.5 font-medium text-right hidden lg:table-cell">Low</th>
                    <th className="px-3 py-3.5 font-medium text-center">Action</th>
                    <th className="px-3 py-3.5 font-medium text-center w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-7 h-7 border-2 border-info border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading stocks...</span>
                      </div>
                    </td></tr>
                  ) : stocks?.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-muted">No stocks found</td></tr>
                  ) : (
                    stocks?.map((stock, idx) => (
                      <tr
                        key={stock.id}
                        className={cn(
                          'border-b border-border/50 last:border-0 cursor-pointer transition-all duration-150 relative',
                          selectedStock?.id === stock.id
                            ? 'bg-primary/5 ring-1 ring-inset ring-primary/15'
                            : idx % 2 === 0 ? 'bg-transparent hover:bg-gray-50' : 'bg-gray-50/80 hover:bg-gray-50'
                        )}
                        onClick={() => handleSelectStock(stock)}
                      >
                        <td className="px-5 sm:px-6 py-4 relative">
                          <div className={cn(
                            'absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-colors',
                            stock.change >= 0 ? 'bg-success' : 'bg-danger'
                          )} />
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground tracking-tight">{stock.symbol}</span>
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded',
                              stock.exchange === 'CSE' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                            )}>{stock.exchange}</span>
                          </div>
                          <div className="text-[11px] text-muted truncate max-w-[120px] sm:max-w-[200px] mt-0.5">{stock.company_name}</div>
                        </td>
                        <td className="px-3 py-4 text-right font-num font-semibold text-foreground">{formatCurrency(stock.last_price)}</td>
                        <td className="px-3 py-4 text-right">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-num',
                            stock.change >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          )}>
                            {stock.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {formatPercent(stock.change_percent)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right font-num text-muted text-xs hidden md:table-cell">{stock.volume.toLocaleString()}</td>
                        <td className="px-3 py-4 text-right font-num text-muted text-xs hidden lg:table-cell">{formatCurrency(stock.open)}</td>
                        <td className="px-3 py-4 text-right font-num text-muted text-xs hidden lg:table-cell">{formatCurrency(stock.high)}</td>
                        <td className="px-3 py-4 text-right font-num text-muted text-xs hidden lg:table-cell">{formatCurrency(stock.low)}</td>
                        <td className="px-3 py-4 text-center">
                          <Button size="sm" variant="ghost" className="text-info hover:bg-info/10 font-medium" onClick={() => handleSelectStock(stock)}>Trade</Button>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <Link to={`/stock/${stock.symbol}`} className="text-muted hover:text-primary transition-colors" title="View details">
                            <ExternalLink size={14} />
                          </Link>
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
        <div className="space-y-5 order-1 lg:order-2">
          <Card padding={false} className="overflow-hidden">
            {/* Header bar */}
            {selectedStock ? (
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 sm:px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base text-foreground">{selectedStock.symbol}</h2>
                    <p className="text-[11px] text-muted mt-0.5 truncate max-w-[180px]">{selectedStock.company_name}</p>
                  </div>
                  <span className={cn(
                    'text-lg font-bold font-num',
                    getChangeColor(selectedStock.change)
                  )}>
                    {formatCurrency(selectedStock.last_price)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-5 sm:px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-base text-foreground">Place Order</h2>
              </div>
            )}

            <div className="px-5 sm:px-6 py-5">
              {!selectedStock ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={28} className="text-muted" />
                  </div>
                  <p className="text-sm text-muted font-medium">Select a stock to trade</p>
                  <p className="text-xs text-muted/70 mt-1">Click any row in the table</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Buy/Sell Toggle */}
                  <div className="flex gap-1.5 p-1.5 bg-gray-50 rounded-xl">
                    <button
                      onClick={() => setOrderType('buy')}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
                        orderType === 'buy'
                          ? 'bg-success text-white shadow-md shadow-success/25'
                          : 'text-muted hover:text-foreground hover:bg-white/[0.08]'
                      )}
                    >Buy</button>
                    <button
                      onClick={() => setOrderType('sell')}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
                        orderType === 'sell'
                          ? 'bg-danger text-white shadow-md shadow-danger/25'
                          : 'text-muted hover:text-foreground hover:bg-white/[0.08]'
                      )}
                    >Sell</button>
                  </div>

                  {/* Stock Info */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2.5 border border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Current Price</span>
                      <span className="font-num font-semibold text-foreground">{formatCurrency(selectedStock.last_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Day Range</span>
                      <span className="font-num text-muted">{formatCurrency(selectedStock.low)} - {formatCurrency(selectedStock.high)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-danger via-warning to-success mt-1 opacity-80" />
                  </div>

                  <Input label="Quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Enter quantity" min="1" />
                  <Input label="Price (BDT)" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" step="0.01" />

                  {totalAmount > 0 && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-info/5 to-transparent border border-info/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-info/5 to-transparent rounded-xl" />
                      <div className="flex justify-between text-sm relative">
                        <span className="text-muted font-medium">Total Amount</span>
                        <span className="font-bold font-num text-foreground text-base">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full !py-3 text-sm font-semibold"
                    variant={orderType === 'buy' ? 'success' : 'danger'}
                    onClick={handlePlaceOrder}
                    loading={placeOrder.isPending}
                    disabled={!quantity || !price}
                  >
                    {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Orders */}
          <Card padding={false} className="overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">Recent Orders</h3>
            </div>
            <div className="px-5 sm:px-6 py-3">
              {orders?.slice(0, 5).map((order, idx) => (
                <div key={order.id} className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0 relative">
                  {/* Timeline dot and line */}
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      order.order_type === 'buy' ? 'bg-success' : 'bg-danger'
                    )} />
                    {idx < Math.min((orders?.length || 0) - 1, 4) && (
                      <div className="w-px h-full bg-border/60 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{order.stock_symbol}</span>
                      <Badge status={order.order_type === 'buy' ? 'active' : 'rejected'} label={order.order_type.toUpperCase()} />
                      <Badge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted font-num">{order.quantity} shares @ {formatCurrency(order.price)}</span>
                      <span className="text-[10px] text-muted">{formatDateTime(order.created_at)}</span>
                    </div>
                  </div>
                </div>
              )) || <p className="text-sm text-muted text-center py-8">No recent orders</p>}
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
