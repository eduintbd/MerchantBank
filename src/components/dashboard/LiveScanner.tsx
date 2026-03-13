import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStocks } from '@/hooks/useStocks';
import { useAllFundamentals } from '@/hooks/useDseFundamentals';
import { formatCurrency, formatVolume, cn } from '@/lib/utils';
import { Search, ArrowUpDown, ExternalLink } from 'lucide-react';

type SortKey = 'symbol' | 'ltp' | 'change_pct' | 'volume' | 'pe' | 'market_cap';
type SortDir = 'asc' | 'desc';
type FilterMode = 'all' | 'gainers' | 'losers' | 'active';

export function LiveScanner() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState<FilterMode>('active');
  const { data: stocks } = useStocks();
  const { data: fundamentals } = useAllFundamentals();

  const fundMap = useMemo(() => {
    const m = new Map<string, any>();
    for (const f of fundamentals || []) m.set(f.symbol, f);
    return m;
  }, [fundamentals]);

  const filtered = useMemo(() => {
    let list = stocks || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.company_name.toLowerCase().includes(q));
    }
    switch (filter) {
      case 'gainers': list = list.filter(s => s.change > 0); break;
      case 'losers': list = list.filter(s => s.change < 0); break;
      case 'active': list = [...list].sort((a, b) => b.volume - a.volume).slice(0, 50); break;
    }

    list = [...list].sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'symbol': return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
        case 'ltp': va = a.last_price; vb = b.last_price; break;
        case 'change_pct': va = a.change_percent; vb = b.change_percent; break;
        case 'volume': va = a.volume; vb = b.volume; break;
        case 'pe': va = fundMap.get(a.symbol)?.pe_ratio || 0; vb = fundMap.get(b.symbol)?.pe_ratio || 0; break;
        case 'market_cap': va = fundMap.get(a.symbol)?.market_cap || 0; vb = fundMap.get(b.symbol)?.market_cap || 0; break;
        default: va = a.volume; vb = b.volume;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [stocks, search, filter, sortKey, sortDir, fundMap]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'active', label: 'Most Active' },
    { key: 'gainers', label: 'Gainers' },
    { key: 'losers', label: 'Losers' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card-solid shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live Scanner
          </h3>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-1">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'px-2.5 py-1.5 text-[10px] font-semibold rounded-md transition-all',
                    filter === f.key
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted hover:text-foreground hover:bg-white/[0.04]'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-hide">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
              {[
                { key: 'symbol' as SortKey, label: 'Symbol', align: 'left' },
                { key: 'ltp' as SortKey, label: 'LTP', align: 'right' },
                { key: 'change_pct' as SortKey, label: 'Chg%', align: 'right' },
                { key: 'volume' as SortKey, label: 'Volume', align: 'right' },
                { key: 'pe' as SortKey, label: 'P/E', align: 'right' },
                { key: 'market_cap' as SortKey, label: 'Mkt Cap', align: 'right' },
              ].map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 font-medium cursor-pointer hover:text-foreground transition-colors select-none',
                    col.align === 'right' && 'text-right',
                    col.key === 'symbol' && 'pl-4 sm:pl-5'
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && <ArrowUpDown size={10} className="text-primary" />}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 pr-4 sm:pr-5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock, i) => {
              const fund = fundMap.get(stock.symbol);
              const isGain = stock.change > 0;
              const isLoss = stock.change < 0;
              return (
                <tr
                  key={stock.symbol}
                  className={cn(
                    'border-t border-border/30 hover:bg-white/[0.03] transition-colors group',
                    i % 2 === 1 && 'bg-white/[0.01]'
                  )}
                >
                  <td className="pl-4 sm:pl-5 pr-3 py-2 relative">
                    <div className={cn(
                      'absolute left-0 top-1 bottom-1 w-[2px] rounded-full',
                      isGain ? 'bg-success' : isLoss ? 'bg-danger' : 'bg-border'
                    )} />
                    <span className="font-semibold text-foreground text-[11px]">{stock.symbol}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-num font-medium text-foreground">{stock.last_price.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={cn(
                      'inline-block min-w-[52px] px-1.5 py-0.5 rounded text-[10px] font-bold font-num text-center',
                      isGain && 'bg-success/15 text-success',
                      isLoss && 'bg-danger/15 text-danger',
                      !isGain && !isLoss && 'text-muted'
                    )}>
                      {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-num text-muted">{formatVolume(stock.volume)}</td>
                  <td className="px-3 py-2 text-right font-num text-muted">{fund?.pe_ratio?.toFixed(1) || '-'}</td>
                  <td className="px-3 py-2 text-right font-num text-muted">{fund?.market_cap ? formatVolume(fund.market_cap) : '-'}</td>
                  <td className="px-3 pr-4 sm:pr-5 py-2">
                    <Link
                      to={`/stock/${stock.symbol}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink size={12} className="text-muted hover:text-primary" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-5 py-2 border-t border-border text-[10px] text-muted flex items-center justify-between">
        <span>{filtered.length} stocks</span>
        <span>Auto-refresh 30s</span>
      </div>
    </div>
  );
}
