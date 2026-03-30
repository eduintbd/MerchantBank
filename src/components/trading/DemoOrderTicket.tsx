import { useState, useMemo } from 'react';
import { ShoppingCart, TrendingDown, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import { useDemo } from '@/contexts/DemoContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TradeChargesBreakdown } from '@/components/trading/TradeChargesBreakdown';
import { useEstimateCharges } from '@/hooks/useFeeRules';
import { usePlaceDemoOrder } from '@/hooks/useDemoOrders';
import type { DemoOrderSide, DemoOrderType } from '@/types/demo';

interface DemoOrderTicketProps {
  stock: {
    symbol: string;
    company_name: string;
    last_price: number;
    high: number;
    low: number;
  } | null;
  onClose?: () => void;
}

export function DemoOrderTicket({ stock, onClose }: DemoOrderTicketProps) {
  const { demoAccount, refreshAccount } = useDemo();
  const [side, setSide] = useState<DemoOrderSide>('BUY');
  const [orderType, setOrderType] = useState<DemoOrderType>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');

  const qty = parseInt(quantity, 10) || 0;
  const limit = parseFloat(limitPrice) || 0;

  const effectivePrice = orderType === 'LIMIT' ? limit : (stock?.last_price ?? 0);
  const grossAmount = qty * effectivePrice;

  const estimate = useEstimateCharges(grossAmount, side);
  const placeOrder = usePlaceDemoOrder();

  const canSubmit = useMemo(() => {
    if (!stock) return false;
    if (qty <= 0) return false;
    if (orderType === 'LIMIT' && limit <= 0) return false;
    if (!demoAccount) return false;
    if (side === 'BUY' && estimate && estimate.netAmount > demoAccount.buying_power) return false;
    return true;
  }, [stock, qty, orderType, limit, demoAccount, side, estimate]);

  async function handleSubmit() {
    if (!canSubmit || !demoAccount || !stock) return;

    try {
      await placeOrder.mutateAsync({
        symbol: stock.symbol,
        side,
        orderType,
        quantity: qty,
        limitPrice: orderType === 'LIMIT' ? limit : null,
        lastPrice: stock.last_price,
        highPrice: stock.high,
        lowPrice: stock.low,
      });

      toast.success(
        `${side} order placed for ${qty} shares of ${stock.symbol}`,
        { description: orderType === 'MARKET' ? 'Market order will fill shortly.' : `Limit price: ${formatCurrency(limit)}` }
      );

      await refreshAccount();
      setQuantity('');
      setLimitPrice('');
      onClose?.();
    } catch (err: any) {
      toast.error('Order failed', {
        description: err?.message || 'Something went wrong. Please try again.',
      });
    }
  }

  // Empty state when no stock is selected
  if (!stock) {
    return (
      <Card padding={false} className="overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-base text-gray-900">Place Demo Order</h2>
        </div>
        <div className="text-center py-12 px-5">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={28} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Select a stock to trade</p>
          <p className="text-xs text-gray-400 mt-1">Click any row in the table</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{stock.symbol}</h3>
          <p className="text-xs text-gray-500">{stock.company_name}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold font-num text-gray-900">{formatCurrency(stock.last_price)}</p>
          <p className="text-[10px] text-gray-500 font-num">
            H: {formatCurrency(stock.high)} / L: {formatCurrency(stock.low)}
          </p>
        </div>
      </div>

      {/* BUY / SELL Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
            side === 'BUY'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          BUY
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
            side === 'SELL'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          <TrendingDown className="w-4 h-4" />
          SELL
        </button>
      </div>

      {/* Order Type Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setOrderType('MARKET')}
          className={cn(
            'py-2 rounded-lg text-xs font-medium transition-all border',
            orderType === 'MARKET'
              ? 'bg-white border-[#0b8a00] text-[#0b8a00] shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
          )}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setOrderType('LIMIT')}
          className={cn(
            'py-2 rounded-lg text-xs font-medium transition-all border',
            orderType === 'LIMIT'
              ? 'bg-white border-[#0b8a00] text-[#0b8a00] shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
          )}
        >
          Limit
        </button>
      </div>

      {/* Quantity */}
      <div className="mb-4">
        <Input
          label="Quantity"
          type="number"
          min="1"
          step="1"
          placeholder="Enter number of shares"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      {/* Limit Price (shown only for LIMIT) */}
      {orderType === 'LIMIT' && (
        <div className="mb-4">
          <Input
            label="Limit Price"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter your limit price"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
          />
        </div>
      )}

      {/* Estimated Charges Breakdown */}
      {qty > 0 && estimate && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Estimated Charges
          </p>
          <TradeChargesBreakdown estimate={estimate} />
        </div>
      )}

      {/* Buying power notice */}
      {demoAccount && side === 'BUY' && (
        <div className="flex items-center gap-1.5 mb-4 text-[11px] text-gray-500">
          <Info className="w-3 h-3 shrink-0" />
          <span>
            Available buying power: <span className="font-semibold font-num">{formatCurrency(demoAccount.buying_power)}</span>
          </span>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          variant={side === 'BUY' ? 'success' : 'danger'}
          size="lg"
          className="flex-1"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={placeOrder.isPending}
        >
          {side === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
        </Button>
        {onClose && (
          <Button variant="ghost" size="lg" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
