import { useState, useMemo } from 'react';
import { useStocks, useOrders } from '@/hooks/useStocks';
import { ExchangeToggle, type ExchangeFilter } from '@/components/ui/ExchangeToggle';
import { Badge } from '@/components/ui/Badge';
import { TradeModal } from '@/components/trading/TradeModal';
import { formatCurrency, formatVolume, formatDateTime, cn } from '@/lib/utils';
import { Search, Zap, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Stock, OrderType } from '@/types';

type Signal = 'BUY' | 'SELL' | 'HOLD';
type SignalFilter = 'ALL' | Signal;

function getStockSignal(stock: Stock): { signal: Signal; score: number; shortTerm: Signal; longTerm: Signal } {
  const changePct = stock.change_percent || 0;
  const volumeStrength = stock.volume > 100000 ? 1 : stock.volume > 50000 ? 0.5 : 0;
  let score = 50;
  score += changePct * 5;
  score += volumeStrength * 10;
  if (stock.high > 0 && stock.low > 0) {
    const dayPos = (stock.last_price - stock.low) / Math.max(stock.high - stock.low, 0.01);
    score += (dayPos - 0.5) * 20;
  }
  score = Math.max(10, Math.min(99, Math.round(score)));

  let signal: Signal = 'HOLD';
  let shortTerm: Signal = 'HOLD';
  let longTerm: Signal = 'HOLD';
  if (score >= 65) { signal = 'BUY'; shortTerm = 'BUY'; longTerm = changePct > 1 ? 'BUY' : 'HOLD'; }
  else if (score <= 35) { signal = 'SELL'; shortTerm = 'SELL'; longTerm = changePct < -1 ? 'SELL' : 'HOLD'; }
  else { shortTerm = changePct >= 0 ? 'BUY' : 'SELL'; longTerm = 'HOLD'; }

  return { signal, score, shortTerm, longTerm };
}

function StockSignalCard({ stock, rank, onTrade }: { stock: Stock & { signal: Signal; score: number; shortTerm: Signal; longTerm: Signal }; rank: number; onTrade: (stock: Stock, type: OrderType) => void }) {
  const { signal, score, shortTerm, longTerm } = stock;
  const signalColors = {
    BUY:  { border: 'border-l-[#00c48c]', bg: 'from-[#00c48c]/8 to-transparent',  badge: 'bg-[#00c48c]/10 text-[#00c48c] border-[#00c48c]/30',  glow: 'hover:shadow-[0_4px_20px_rgba(0,196,140,0.15)]', btn: 'bg-[#00c48c] hover:bg-[#00dba0] text-black',  scoreFill: 'from-[#00c48c] to-[#00e5a0]' },
    SELL: { border: 'border-l-[#ff4d6a]', bg: 'from-[#ff4d6a]/8 to-transparent',  badge: 'bg-[#ff4d6a]/10 text-[#ff4d6a] border-[#ff4d6a]/30',  glow: 'hover:shadow-[0_4px_20px_rgba(255,77,106,0.15)]',  btn: 'bg-[#ff4d6a] hover:bg-[#ff6b83] text-white',  scoreFill: 'from-[#ff4d6a] to-[#ff8fa3]' },
    HOLD: { border: 'border-l-[#f0b429]', bg: 'from-[#f0b429]/8 to-transparent',  badge: 'bg-[#f0b429]/10 text-[#f0b429] border-[#f0b429]/30',  glow: 'hover:shadow-[0_4px_20px_rgba(240,180,41,0.1)]',   btn: 'bg-[#f0b429] hover:bg-[#f5c040] text-black',  scoreFill: 'from-[#f0b429] to-[#f5d060]' },
  };
  const c = signalColors[signal];
  const isGain = stock.change >= 0;
  return (
    <div className={cn('relative rounded-xl border border-border bg-gradient-to-br p-4 border-l-[3px] transition-all duration-200 cursor-pointer group', c.border, c.bg, c.glow, 'hover:-translate-y-[2px]')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#f0b429] bg-[#f0b429]/10 px-1.5 py-0.5 rounded">#{rank}</span>
          <span className="font-bold text-foreground tracking-tight">{stock.symbol}</span>
          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded',
            stock.exchange === 'CSE' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
          )}>{stock.exchange}</span>
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border', c.badge)}>
          {signal} {signal === 'BUY' ? '▲' : signal === 'SELL' ? '▼' : '─'}
        </span>
      </div>
      <p className="text-xs text-muted truncate mb-2">{stock.company_name}</p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xl font-bold font-num text-foreground">৳{stock.last_price.toFixed(2)}</span>
        <span className={cn('text-xs font-semibold font-num', isGain ? 'text-[#00c48c]' : 'text-[#ff4d6a]')}>
          {isGain ? '▲' : '▼'} {isGain ? '+' : ''}{stock.change_percent.toFixed(2)}%
        </span>
        <span className="text-[10px] text-muted font-num ml-auto">Vol: {formatVolume(stock.volume)}</span>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted font-semibold">Score: {score}/100</span>
          <span className="text-[10px] text-muted">{score >= 65 ? 'Strong' : score >= 45 ? 'Moderate' : 'Weak'}</span>
        </div>
        <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', c.scoreFill)} style={{ width: `${score}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded',
          shortTerm === 'BUY' ? 'bg-[#00c48c]/10 text-[#00c48c]' : shortTerm === 'SELL' ? 'bg-[#ff4d6a]/10 text-[#ff4d6a]' : 'bg-[#f0b429]/10 text-[#f0b429]'
        )}>Short: {shortTerm}</span>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded',
          longTerm === 'BUY' ? 'bg-[#00c48c]/10 text-[#00c48c]' : longTerm === 'SELL' ? 'bg-[#ff4d6a]/10 text-[#ff4d6a]' : 'bg-[#f0b429]/10 text-[#f0b429]'
        )}>Long: {longTerm}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted mb-3">
        {stock.week_52_high ? <span>52W High: ৳{stock.week_52_high.toFixed(2)}</span> : <span />}
        <span>{stock.sector}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); onTrade(stock, signal === 'SELL' ? 'sell' : 'buy'); }} className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-all', c.btn)}>
          {signal === 'SELL' ? 'Sell Now' : 'Buy Now'}
        </button>
        <Link to={`/stock/${stock.symbol}`} onClick={(e) => e.stopPropagation()} className="px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:text-foreground hover:bg-surface transition-colors">
          Details
        </Link>
      </div>
    </div>
  );
}

export function ProView() {
  const [search, setSearch] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter>('ALL');
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('ALL');
  const [tradeStock, setTradeStock] = useState<{ stock: Stock; type: OrderType } | null>(null);

  const { data: allStocks, isLoading } = useStocks(search);
  const { data: orders } = useOrders();

  const processedStocks = useMemo(() => {
    if (!allStocks) return [];
    return allStocks
      .filter(s => s.last_price > 0)
      .map(s => ({ ...s, ...getStockSignal(s) }))
      .sort((a, b) => b.score - a.score);
  }, [allStocks]);

  const filteredStocks = useMemo(() => {
    let stocks = processedStocks;
    if (exchangeFilter !== 'ALL') stocks = stocks.filter(s => s.exchange === exchangeFilter);
    if (signalFilter !== 'ALL') stocks = stocks.filter(s => s.signal === signalFilter);
    return stocks;
  }, [processedStocks, exchangeFilter, signalFilter]);

  const signalCounts = useMemo(() => {
    const base = exchangeFilter !== 'ALL' ? processedStocks.filter(s => s.exchange === exchangeFilter) : processedStocks;
    return {
      ALL: base.length,
      BUY: base.filter(s => s.signal === 'BUY').length,
      SELL: base.filter(s => s.signal === 'SELL').length,
      HOLD: base.filter(s => s.signal === 'HOLD').length,
    };
  }, [processedStocks, exchangeFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Zap size={22} className="text-[#f0b429]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Abaci Signal</h1>
          </div>
          <p className="text-muted text-sm mt-1">AI-ranked BUY/SELL signals for DSE & CSE stocks</p>
        </div>
        <ExchangeToggle value={exchangeFilter} onChange={setExchangeFilter} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['ALL', 'BUY', 'SELL', 'HOLD'] as SignalFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setSignalFilter(f)}
              className={cn(
                'px-3 py-2 text-xs font-bold rounded-lg transition-all border',
                signalFilter === f
                  ? f === 'BUY' ? 'bg-[#00c48c]/15 text-[#00c48c] border-[#00c48c]/30'
                    : f === 'SELL' ? 'bg-[#ff4d6a]/15 text-[#ff4d6a] border-[#ff4d6a]/30'
                    : f === 'HOLD' ? 'bg-[#f0b429]/15 text-[#f0b429] border-[#f0b429]/30'
                    : 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface text-muted border-border hover:text-foreground'
              )}
            >
              {f} <span className="ml-1 opacity-60">{signalCounts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted">Loading stock signals...</p>
        </div>
      )}

      {!isLoading && filteredStocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <BarChart2 size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No {signalFilter !== 'ALL' ? signalFilter : ''} signals found{exchangeFilter !== 'ALL' ? ` in ${exchangeFilter}` : ''}</p>
          <p className="text-xs text-muted/60 mt-1">Try changing your filters or check back after market opens</p>
        </div>
      )}

      {!isLoading && filteredStocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.slice(0, 30).map((stock, idx) => (
            <StockSignalCard
              key={stock.symbol}
              stock={stock}
              rank={idx + 1}
              onTrade={(s, type) => setTradeStock({ stock: s, type })}
            />
          ))}
        </div>
      )}

      {filteredStocks.length > 30 && (
        <p className="text-center text-xs text-muted mt-4">Showing top 30 of {filteredStocks.length} stocks</p>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card-solid overflow-hidden shadow-[var(--shadow-card)]">
          <div className="px-5 py-3.5 border-b border-border bg-surface">
            <h3 className="text-sm font-bold text-foreground">Recent Orders</h3>
          </div>
          <div className="px-5 py-2">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={cn('w-2 h-2 rounded-full', order.order_type === 'buy' ? 'bg-[#00c48c]' : 'bg-[#ff4d6a]')} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{order.stock_symbol}</span>
                      <Badge status={order.order_type === 'buy' ? 'active' : 'rejected'} label={order.order_type.toUpperCase()} />
                    </div>
                    <span className="text-xs text-muted font-num">{order.quantity} shares @ {formatCurrency(order.price)}</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted">{formatDateTime(order.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tradeStock && <TradeModal stock={tradeStock.stock} initialType={tradeStock.type} onClose={() => setTradeStock(null)} />}
    </div>
  );
}
