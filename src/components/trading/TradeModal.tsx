import { useState } from 'react';
import { X } from 'lucide-react';
import { usePlaceOrder } from '@/hooks/useStocks';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Stock, OrderType } from '@/types';

interface Props {
  stock: Stock;
  initialType?: OrderType;
  onClose: () => void;
}

export function TradeModal({ stock, initialType = 'buy', onClose }: Props) {
  const [orderType, setOrderType] = useState<OrderType>(initialType);
  const [amount, setAmount] = useState('');
  const placeOrder = usePlaceOrder();

  const shares = amount && stock.last_price > 0 ? Math.floor(parseFloat(amount) / stock.last_price) : 0;
  const estValue = shares * stock.last_price;
  const brokerage = estValue * 0.005;

  async function handleConfirm() {
    if (!shares) return;
    try {
      await placeOrder.mutateAsync({
        stock_symbol: stock.symbol,
        order_type: orderType,
        quantity: shares,
        price: stock.last_price,
      });
      toast.success(`${orderType.toUpperCase()} order placed`, {
        description: `${shares} x ${stock.symbol} @ ৳${stock.last_price.toFixed(2)}`,
      });
      onClose();
    } catch (err: any) {
      toast.error('Order failed', { description: err?.message || 'Please try again' });
    }
  }

  function pick(amt: number) { setAmount(String(amt)); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-card-solid border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground">Trade {stock.symbol}</h3>
            <p className="text-xs text-muted">{stock.company_name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="text-center py-2">
            <p className="text-xs text-muted mb-1">Current Price</p>
            <p className="text-2xl font-bold font-num text-foreground">৳{stock.last_price.toFixed(2)}</p>
          </div>

          <div className="flex gap-1 p-1 bg-surface rounded-xl">
            <button
              onClick={() => setOrderType('buy')}
              className={cn('flex-1 py-2.5 text-sm font-bold rounded-lg transition-all',
                orderType === 'buy' ? 'bg-[#00c48c] text-black shadow-lg' : 'text-muted hover:text-foreground'
              )}
            >BUY</button>
            <button
              onClick={() => setOrderType('sell')}
              className={cn('flex-1 py-2.5 text-sm font-bold rounded-lg transition-all',
                orderType === 'sell' ? 'bg-[#ff4d6a] text-white shadow-lg' : 'text-muted hover:text-foreground'
              )}
            >SELL</button>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Amount (৳)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount in BDT"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-num text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-1.5 mt-2">
              {[5000, 25000, 100000].map(v => (
                <button key={v} onClick={() => pick(v)}
                  className="flex-1 text-xs font-medium text-muted border border-border rounded-lg py-1.5 hover:bg-surface hover:text-foreground transition-colors">
                  ৳{v >= 100000 ? `${v / 100000}L` : `${v / 1000}K`}
                </button>
              ))}
            </div>
            {shares > 0 && <p className="text-xs text-muted mt-2">≈ {shares} shares</p>}
          </div>

          {shares > 0 && (
            <div className="space-y-2 p-3 bg-surface rounded-xl border border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Est. Value</span>
                <span className="font-num font-semibold text-foreground">৳{estValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Brokerage (0.5%)</span>
                <span className="font-num text-muted">৳{brokerage.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-xs">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-num font-bold text-foreground">৳{(estValue + brokerage).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!shares || placeOrder.isPending}
            className={cn(
              'w-full py-3.5 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed',
              orderType === 'buy'
                ? 'bg-[#00c48c] text-black hover:bg-[#00dba0]'
                : 'bg-[#ff4d6a] text-white hover:bg-[#ff6b83]'
            )}
          >
            {placeOrder.isPending ? 'Processing…' : `Confirm ${orderType === 'buy' ? 'Buy' : 'Sell'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
