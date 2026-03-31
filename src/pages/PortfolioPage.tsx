import { useState, useRef, useEffect } from 'react';
import { usePortfolio } from '@/hooks/useStocks';
import { useStocks } from '@/hooks/useStocks';
import { useLocalPortfolioEnriched } from '@/hooks/useLocalPortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercent, getChangeColor, cn } from '@/lib/utils';
import { Briefcase, TrendingUp, TrendingDown, BarChart3, Upload, Plus, Search, X, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PortfolioUploadModal } from '@/components/portfolio/PortfolioUploadModal';
import { toast } from 'sonner';
import type { Stock } from '@/types';

const COLORS = ['#4fa3e0', '#00d09c', '#ffa502', '#ff4757', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

/* ─── Add Stock Modal ─── */
function AddStockModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (symbol: string, qty: number, price: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Stock | null>(null);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: stocks } = useStocks(search);

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelected(null);
      setQty('');
      setPrice('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function handleSelect(stock: Stock) {
    setSelected(stock);
    setPrice(stock.last_price.toString());
    setSearch('');
  }

  function handleSubmit() {
    if (!selected || !qty || !price) return;
    const q = parseInt(qty);
    const p = parseFloat(price);
    if (q <= 0 || p <= 0) return;
    onAdd(selected.symbol, q, p);
    toast.success(`Added ${q} shares of ${selected.symbol}`);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg">Add Stock to Portfolio</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!selected ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search stock symbol or name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Results */}
              {search.length >= 1 && (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {!stocks || stocks.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted">No stocks found</div>
                  ) : (
                    stocks.slice(0, 20).map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleSelect(stock)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div>
                          <div className="font-semibold text-sm">{stock.symbol}</div>
                          <div className="text-xs text-muted truncate max-w-[200px]">{stock.company_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-num font-semibold">{formatCurrency(stock.last_price)}</div>
                          <div className={cn('text-xs font-num', stock.change >= 0 ? 'text-success' : 'text-danger')}>
                            {stock.change >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {!search && (
                <p className="text-xs text-muted text-center py-4">
                  Type a stock symbol (e.g. GP, BRAC, SQURPHARMA) to search
                </p>
              )}
            </>
          ) : (
            <>
              {/* Selected stock */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div>
                  <div className="font-bold text-sm">{selected.symbol}</div>
                  <div className="text-xs text-muted">{selected.company_name}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-muted hover:text-danger">
                  Change
                </button>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Quantity</label>
                <input
                  type="number"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="e.g. 100"
                  min="1"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Buy Price */}
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Average Buy Price (BDT)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. 420.50"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Total */}
              {qty && price && parseInt(qty) > 0 && parseFloat(price) > 0 && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-border">
                  <span className="text-xs text-muted">Total Invested</span>
                  <span className="font-bold font-num text-sm">{formatCurrency(parseInt(qty) * parseFloat(price))}</span>
                </div>
              )}

              <Button className="w-full" onClick={handleSubmit} disabled={!qty || !price || parseInt(qty) <= 0 || parseFloat(price) <= 0}>
                Add to Portfolio
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Portfolio Page ─── */
export function PortfolioPage() {
  const { isGuest } = useAuth();
  const { data: dbPortfolio, isLoading: dbLoading } = usePortfolio();
  const { data: localPortfolio, addHolding, removeHolding, clearAll, holdings: localHoldings } = useLocalPortfolioEnriched();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Merge: for guests use local only; for logged-in users merge both
  const portfolio = isGuest
    ? localPortfolio
    : (() => {
        if (!dbPortfolio && !localPortfolio) return undefined;
        const dbItems = dbPortfolio?.items || [];
        const localItems = (localPortfolio?.items || []).filter(
          li => !dbItems.find(di => di.stock_symbol === li.stock_symbol)
        );
        const allItems = [...dbItems, ...localItems];
        const totalInvested = allItems.reduce((s, i) => s + i.total_invested, 0);
        const currentValue = allItems.reduce((s, i) => s + i.current_value, 0);
        return {
          total_invested: totalInvested,
          current_value: currentValue,
          total_profit_loss: currentValue - totalInvested,
          total_profit_loss_percent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
          total_stocks: allItems.length,
          items: allItems,
        };
      })();

  const isLoading = isGuest ? false : dbLoading;

  function handleAddStock(symbol: string, qty: number, price: number) {
    addHolding({ stock_symbol: symbol, quantity: qty, avg_buy_price: price });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  const pieData = portfolio?.items.map(item => ({ name: item.stock_symbol, value: item.current_value })) || [];
  const barData = portfolio?.items.map(item => ({ name: item.stock_symbol, profit: item.profit_loss, percent: item.profit_loss_percent })) || [];

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted text-sm sm:text-base mt-1">Track your investment performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)} variant="success" icon={<Plus size={16} />}>
            Add Stock
          </Button>
          <Button onClick={() => setUploadOpen(true)} variant="secondary" icon={<Upload size={16} />}>
            Import
          </Button>
        </div>
      </div>

      {isGuest && localHoldings.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-info/5 border border-info/20 flex items-center justify-between gap-3">
          <p className="text-xs text-info">
            Your portfolio is saved in this browser. Sign up to save it permanently.
          </p>
          <button onClick={clearAll} className="text-xs text-muted hover:text-danger shrink-0 flex items-center gap-1">
            <Trash2 size={12} /> Clear
          </button>
        </div>
      )}

      <PortfolioUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <AddStockModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddStock} />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        <StatCard
          title="Current Value"
          value={formatCurrency(portfolio?.current_value || 0)}
          icon={<Briefcase size={20} />}
          iconColor="bg-info/15 text-info"
          gradient="grad-info"
        />
        <StatCard
          title="Total Invested"
          value={formatCurrency(portfolio?.total_invested || 0)}
          icon={<BarChart3 size={20} />}
          iconColor="bg-warning/15 text-warning"
          gradient="grad-warning"
        />
        <StatCard
          title="Total P/L"
          value={formatCurrency(portfolio?.total_profit_loss || 0)}
          icon={portfolio && portfolio.total_profit_loss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          iconColor={portfolio && portfolio.total_profit_loss >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}
          gradient={portfolio && portfolio.total_profit_loss >= 0 ? 'grad-success' : 'grad-danger'}
          trend={portfolio ? { value: portfolio.total_profit_loss_percent, label: 'overall' } : undefined}
        />
        <StatCard
          title="Holdings"
          value={portfolio?.total_stocks || 0}
          subtitle="Active stocks"
          icon={<BarChart3 size={20} />}
          iconColor="bg-success/15 text-success"
          gradient="grad-primary"
        />
      </div>

      {/* Charts */}
      {portfolio && portfolio.items.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <Card>
              <h3 className="font-semibold text-base mb-5">Portfolio Allocation</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    stroke="none"
                    fontSize={12}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, color: '#1a1a2e', fontSize: 13, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="font-semibold text-base mb-5">Profit/Loss by Stock</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" fontSize={12} tick={{ fill: '#6b7280' }} />
                  <YAxis fontSize={12} tick={{ fill: '#6b7280' }} tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}`} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, color: '#1a1a2e', fontSize: 13, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.profit >= 0 ? '#00d09c' : '#ff4757'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="mt-6 sm:mt-8">
        <Card padding={false}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-base">Holdings</h3>
            <button onClick={() => setAddOpen(true)} className="text-xs text-info hover:underline flex items-center gap-1">
              <Plus size={12} /> Add Stock
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border">
                  <th className="px-4 sm:px-6 py-3.5 font-medium">Stock</th>
                  <th className="px-3 py-3.5 font-medium text-right">Qty</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden sm:table-cell">Avg Buy</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden sm:table-cell">Current</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Invested</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Value</th>
                  <th className="px-3 py-3.5 font-medium text-right">P/L</th>
                  <th className="px-4 sm:px-6 py-3.5 font-medium text-right">P/L %</th>
                  {localHoldings.length > 0 && <th className="px-2 py-3.5 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {!portfolio?.items.length ? (
                  <tr><td colSpan={9} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Briefcase size={32} className="text-muted/30" />
                      <p className="text-sm text-muted">No holdings yet</p>
                      <Button size="sm" onClick={() => setAddOpen(true)} icon={<Plus size={14} />}>
                        Add Your First Stock
                      </Button>
                    </div>
                  </td></tr>
                ) : (
                  portfolio.items.map(item => {
                    const isLocal = item.id.startsWith('local-');
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{item.stock_symbol}</span>
                            {isLocal && <span className="text-[9px] bg-info/10 text-info px-1.5 py-0.5 rounded font-medium">Local</span>}
                          </div>
                          <div className="text-xs text-muted hidden sm:block">{item.company_name}</div>
                        </td>
                        <td className="px-3 py-4 text-right font-num">{item.quantity}</td>
                        <td className="px-3 py-4 text-right font-num hidden sm:table-cell">{formatCurrency(item.avg_buy_price)}</td>
                        <td className="px-3 py-4 text-right font-num hidden sm:table-cell">{formatCurrency(item.current_price)}</td>
                        <td className="px-3 py-4 text-right font-num hidden md:table-cell">{formatCurrency(item.total_invested)}</td>
                        <td className="px-3 py-4 text-right font-num font-medium hidden md:table-cell">{formatCurrency(item.current_value)}</td>
                        <td className={`px-3 py-4 text-right font-num font-medium ${getChangeColor(item.profit_loss)}`}>
                          {formatCurrency(item.profit_loss)}
                        </td>
                        <td className={`px-4 sm:px-6 py-4 text-right font-num font-medium ${getChangeColor(item.profit_loss_percent)}`}>
                          {formatPercent(item.profit_loss_percent)}
                        </td>
                        {localHoldings.length > 0 && (
                          <td className="px-2 py-4">
                            {isLocal && (
                              <button onClick={() => removeHolding(item.stock_symbol)} className="text-muted hover:text-danger" title="Remove">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
