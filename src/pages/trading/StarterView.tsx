import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStocks, useOrders } from '@/hooks/useStocks';
import { ExchangeToggle, type ExchangeFilter } from '@/components/ui/ExchangeToggle';
import { TradeModal } from '@/components/trading/TradeModal';
import { Search, TrendingUp, TrendingDown, Flame, ChevronRight } from 'lucide-react';
import { formatCurrency, formatVolume, cn } from '@/lib/utils';
import type { Stock } from '@/types';

function StockRow({ stock, onTrade }: { stock: Stock; onTrade: (s: Stock) => void }) {
  const isGain = stock.change >= 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center shrink-0 text-[11px] font-bold text-foreground">
        {stock.symbol.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{stock.symbol}</p>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-muted bg-muted/10">
            {stock.exchange}
          </span>
        </div>
        <p className="text-[11px] text-muted truncate">{stock.company_name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-num font-semibold">৳{stock.last_price.toFixed(2)}</p>
        <p className={cn('text-[11px] font-num font-semibold', isGain ? 'text-[#00c48c]' : 'text-[#ff4d6a]')}>
          {isGain ? '+' : ''}{stock.change_percent.toFixed(2)}%
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onTrade(stock)}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          Trade
        </button>
        <Link to={`/stock/${stock.symbol}`} className="text-muted hover:text-foreground p-1">
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function HeroCard({ stock, onTrade }: { stock: Stock; onTrade: (s: Stock) => void }) {
  const isGain = stock.change >= 0;
  return (
    <div className={cn(
      'rounded-2xl p-5 sm:p-6 bg-gradient-to-br transition-all',
      isGain
        ? 'from-[#00c48c]/10 via-[#00c48c]/5 to-transparent border border-[#00c48c]/20'
        : 'from-[#ff4d6a]/10 via-[#ff4d6a]/5 to-transparent border border-[#ff4d6a]/20'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f0b429]/15 text-[#f0b429] text-[10px] font-bold uppercase tracking-wider">
          <Flame size={11} /> Top mover today
        </span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{stock.symbol}</h2>
          <p className="text-sm text-muted truncate">{stock.company_name}</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-bold font-num">৳{stock.last_price.toFixed(2)}</span>
            <span className={cn('text-sm font-bold font-num', isGain ? 'text-[#00c48c]' : 'text-[#ff4d6a]')}>
              {isGain ? '▲' : '▼'} {isGain ? '+' : ''}{stock.change_percent.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-muted mt-1">Volume: {formatVolume(stock.volume)}</p>
        </div>
        <button
          onClick={() => onTrade(stock)}
          className={cn(
            'px-5 py-2.5 text-sm font-bold rounded-xl shrink-0 transition-all hover:scale-[1.02]',
            isGain
              ? 'bg-[#00c48c] text-black hover:bg-[#00dba0]'
              : 'bg-foreground text-background hover:opacity-90'
          )}
        >
          {isGain ? 'Buy now' : 'Trade'}
        </button>
      </div>
    </div>
  );
}

function HorizontalStrip({ title, icon: Icon, stocks, onTrade }: { title: string; icon: typeof Flame; stocks: Stock[]; onTrade: (s: Stock) => void }) {
  if (stocks.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} className="text-muted" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {stocks.slice(0, 8).map(s => {
          const isGain = s.change >= 0;
          return (
            <button key={s.symbol} onClick={() => onTrade(s)}
              className="shrink-0 w-[150px] text-left rounded-xl border border-border p-3 hover:border-foreground/15 hover:bg-surface transition-colors">
              <p className="font-semibold text-sm">{s.symbol}</p>
              <p className="text-[10px] text-muted truncate mb-2">{s.company_name}</p>
              <p className="text-base font-num font-bold">৳{s.last_price.toFixed(2)}</p>
              <p className={cn('text-[11px] font-num font-semibold mt-0.5', isGain ? 'text-[#00c48c]' : 'text-[#ff4d6a]')}>
                {isGain ? '+' : ''}{s.change_percent.toFixed(2)}%
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function StarterView() {
  const [search, setSearch] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter>('ALL');
  const [tradeStock, setTradeStock] = useState<Stock | null>(null);

  const { data: stocks, isLoading } = useStocks(search);
  const { data: orders } = useOrders();

  const filtered = useMemo(() => {
    if (!stocks) return [];
    let s = stocks.filter(x => x.last_price > 0);
    if (exchangeFilter !== 'ALL') s = s.filter(x => x.exchange === exchangeFilter);
    return s;
  }, [stocks, exchangeFilter]);

  const byMovementDesc = useMemo(() => [...filtered].sort((a, b) => (b.change_percent ?? 0) - (a.change_percent ?? 0)), [filtered]);
  const byMovementAsc = useMemo(() => [...filtered].sort((a, b) => (a.change_percent ?? 0) - (b.change_percent ?? 0)), [filtered]);
  const byVolume = useMemo(() => [...filtered].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)), [filtered]);

  const hero = byVolume[0];
  const gainers = byMovementDesc.filter(s => s.change_percent > 0).slice(0, 8);
  const losers = byMovementAsc.filter(s => s.change_percent < 0).slice(0, 8);
  const watchlist = byVolume.slice(0, 15);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Search + exchange toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search stocks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <ExchangeToggle value={exchangeFilter} onChange={setExchangeFilter} />
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      )}

      {!isLoading && hero && <HeroCard stock={hero} onTrade={setTradeStock} />}

      {!isLoading && (
        <>
          <HorizontalStrip title="Top gainers" icon={TrendingUp} stocks={gainers} onTrade={setTradeStock} />
          <HorizontalStrip title="Top losers" icon={TrendingDown} stocks={losers} onTrade={setTradeStock} />

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Most active</h3>
              <span className="text-xs text-muted">{watchlist.length} of {filtered.length}</span>
            </div>
            <div className="rounded-2xl border border-border bg-card-solid overflow-hidden divide-y divide-border">
              {watchlist.map(s => <StockRow key={s.symbol} stock={s} onTrade={setTradeStock} />)}
              {watchlist.length === 0 && (
                <div className="p-6 text-center text-sm text-muted">No stocks match your search.</div>
              )}
            </div>
          </section>

          {orders && orders.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Recent orders</h3>
              <div className="rounded-2xl border border-border bg-card-solid overflow-hidden divide-y divide-border">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2 h-2 rounded-full', o.order_type === 'buy' ? 'bg-[#00c48c]' : 'bg-[#ff4d6a]')} />
                      <div>
                        <p className="text-sm font-semibold">{o.stock_symbol} <span className="text-[10px] font-bold uppercase text-muted ml-1">{o.order_type}</span></p>
                        <p className="text-[11px] text-muted font-num">{o.quantity} @ {formatCurrency(o.price)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted">{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {tradeStock && <TradeModal stock={tradeStock} onClose={() => setTradeStock(null)} />}
    </div>
  );
}
