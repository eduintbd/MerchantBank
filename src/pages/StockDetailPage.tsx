import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStock } from '@/hooks/useStocks';
import { useFundamentals, useDividendHistory, usePriceHistory, useFinancialStatements } from '@/hooks/useDseFundamentals';
import { formatCurrency, formatNumber, formatVolume, cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Activity,
  BarChart2,
  Building2,
  DollarSign,
  Newspaper,
  ArrowUpDown,
  Star,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

type DetailTab = 'fundamentals' | 'news';
type Period = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('3M');
  const [activeTab, setActiveTab] = useState<DetailTab>('fundamentals');

  const { data: stock, isLoading: stockLoading } = useStock(symbol || '');
  const { data: fundamentals } = useFundamentals(symbol);
  const { data: dividends } = useDividendHistory(symbol);
  const { data: priceHistory } = usePriceHistory(symbol, period);
  const { data: financials } = useFinancialStatements(symbol);

  const { annualData, quarterlyData } = useMemo(() => {
    if (!financials) return { annualData: [], quarterlyData: [] };
    const annual = financials.filter((f: any) => f.period_type === 'ANNUAL' || !f.period_type);
    const quarterly = financials.filter((f: any) => f.period_type && f.period_type !== 'ANNUAL');
    return { annualData: annual, quarterlyData: quarterly };
  }, [financials]);

  // Period stats from price history
  const periodStats = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return null;
    const first = priceHistory[0];
    const last = priceHistory[priceHistory.length - 1];
    const periodChange = ((last.close - first.close) / first.close * 100).toFixed(2);
    const periodHigh = Math.max(...priceHistory.map((b: any) => b.high));
    const periodLow = Math.min(...priceHistory.map((b: any) => b.low));
    const avgVolume = Math.round(priceHistory.reduce((s: number, b: any) => s + (b.volume || 0), 0) / priceHistory.length);
    return { periodChange, periodHigh, periodLow, avgVolume };
  }, [priceHistory]);

  if (stockLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted mt-3">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Activity size={40} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Stock not found</p>
          <Link to="/trading" className="text-sm text-info mt-2 inline-block hover:underline">Back to Trading</Link>
        </div>
      </div>
    );
  }

  const isGain = stock.change >= 0;
  const dayRange = stock.high - stock.low;
  const dayRangePct = dayRange > 0 ? ((stock.last_price - stock.low) / dayRange) * 100 : 50;
  const volatility = stock.close > 0 ? ((dayRange / stock.close) * 100).toFixed(2) : '0.00';
  const volNum = parseFloat(volatility);
  const volLabel = volNum > 5 ? 'High' : volNum > 2 ? 'Moderate' : 'Stable';

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="space-y-4" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>

        {/* Back nav */}
        <Link to="/trading" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Market
        </Link>

        {/* ============================================
            STOCK HEADER CARD
           ============================================ */}
        <div className="rounded-xl border border-border bg-card-solid p-4 sm:p-5 shadow-[var(--shadow-card)]">
          {/* Top: Symbol + Actions */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{stock.symbol}</h1>
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  isGain ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                )}>
                  {isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-muted mt-0.5">{stock.company_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/trading?symbol=${stock.symbol}`}
                className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary font-medium hover:bg-primary/20 transition-colors"
              >
                Trade
              </Link>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {stock.sector && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-muted border border-border">
                <Activity size={11} /> {stock.sector}
              </span>
            )}
            <span className={cn(
              'ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium',
              volLabel === 'Stable' ? 'bg-gray-50 text-muted border border-border'
                : volLabel === 'Moderate' ? 'bg-warning/10 text-warning'
                : 'bg-danger/10 text-danger'
            )}>
              {volLabel}
            </span>
          </div>

          {/* Price + OHLC */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Last Traded Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-foreground font-num">৳{stock.last_price.toFixed(2)}</span>
                <span className={cn('text-lg font-semibold font-num', isGain ? 'text-success' : 'text-danger')}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {[
                { label: 'Open', val: stock.open },
                { label: 'High', val: stock.high },
                { label: 'Low', val: stock.low },
                { label: 'Prev Close', val: stock.close },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between gap-3">
                  <span className="text-muted">{r.label}:</span>
                  <span className="font-num font-semibold text-foreground">৳{r.val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================
            DAY RANGE BAR
           ============================================ */}
        <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Day Range</span>
            <span className="text-xs text-muted">
              Volatility: <span className="font-bold text-warning">{volatility}%</span>
            </span>
          </div>
          <div className="relative h-2.5 rounded-full overflow-hidden bg-border/30">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(to right, #f6465d, #ffa502, #0ecb81)' }}
            />
            <div
              className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg transition-all duration-300"
              style={{ left: `calc(${Math.max(0, Math.min(100, dayRangePct))}% - 2px)` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <span className="text-danger font-num">৳{stock.low.toFixed(2)}</span>
            <span className="text-muted">Current: ৳{stock.last_price.toFixed(2)}</span>
            <span className="text-success font-num">৳{stock.high.toFixed(2)}</span>
          </div>
        </div>

        {/* ============================================
            PRICE HISTORY CHART
           ============================================ */}
        <div className="rounded-xl border border-border bg-card-solid p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{stock.symbol} Price History</h3>
            {periodStats && (
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold',
                parseFloat(periodStats.periodChange) >= 0 ? 'text-success' : 'text-danger'
              )}>
                <TrendingUp size={12} />
                {parseFloat(periodStats.periodChange) >= 0 ? '+' : ''}{periodStats.periodChange}%
              </span>
            )}
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 mb-3">
            {(['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  period === p
                    ? 'bg-info text-white'
                    : 'text-muted hover:text-foreground hover:bg-gray-50'
                )}
              >{p}</button>
            ))}
          </div>

          {/* Chart */}
          {priceHistory && priceHistory.length > 0 ? (
            <>
              <div className="h-[220px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isGain ? '#0ecb81' : '#f6465d'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isGain ? '#0ecb81' : '#f6465d'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="trade_date"
                      fontSize={10}
                      tick={{ fill: 'rgba(0,0,0,0.4)' }}
                      tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      fontSize={10}
                      tick={{ fill: 'rgba(0,0,0,0.4)' }}
                      domain={['auto','auto']}
                      tickFormatter={(v: number) => v.toFixed(0)}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontSize: 11, color: '#111827', padding: '8px 12px' }}
                      formatter={(value: any) => [`৳${Number(value).toFixed(2)}`, 'Close']}
                      labelFormatter={(label: any) => new Date(String(label)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    />
                    <Area type="monotone" dataKey="close" stroke={isGain ? '#0ecb81' : '#f6465d'} strokeWidth={1.5} fillOpacity={1} fill="url(#areaGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume bars */}
              <div className="h-[50px] mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceHistory} margin={{ top: 0, right: 4, left: -10, bottom: 0 }}>
                    <XAxis dataKey="trade_date" hide />
                    <Bar dataKey="volume" radius={[1,1,0,0]}>
                      {priceHistory.map((e: any, i: number) => (
                        <Cell key={i} fill={e.close >= e.open ? 'rgba(14,203,129,0.35)' : 'rgba(246,70,93,0.35)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Period stats */}
              {periodStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <div className="rounded-lg border border-border bg-gray-50/80 p-2.5">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Period Change</p>
                    <p className={cn('text-sm font-bold font-num', parseFloat(periodStats.periodChange) >= 0 ? 'text-success' : 'text-danger')}>
                      {parseFloat(periodStats.periodChange) >= 0 ? '+' : ''}{periodStats.periodChange}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-gray-50/80 p-2.5">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Period High</p>
                    <p className="text-sm font-bold text-success font-num">৳{periodStats.periodHigh.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-gray-50/80 p-2.5">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Period Low</p>
                    <p className="text-sm font-bold text-danger font-num">৳{periodStats.periodLow.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-gray-50/80 p-2.5">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Avg Volume</p>
                    <p className="text-sm font-bold text-foreground font-num">{formatVolume(periodStats.avgVolume)}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted">
              <BarChart2 size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No price history available</p>
            </div>
          )}
        </div>

        {/* ============================================
            TRADING ACTIVITY CARDS
           ============================================ */}
        <div>
          <h3 className="text-sm font-bold text-info uppercase tracking-wider mb-2">Trading Activity</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: BarChart2, label: 'Volume', value: formatVolume(stock.volume), color: 'text-info', bg: 'bg-info/10' },
              { icon: Activity, label: 'Trades', value: '—', color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { icon: DollarSign, label: 'Value (Mn)', value: stock.market_cap ? `${(stock.market_cap / 1_000_000).toFixed(2)}M` : '—', color: 'text-success', bg: 'bg-success/10' },
              { icon: ArrowUpDown, label: 'Change %', value: `${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%`, color: isGain ? 'text-success' : 'text-danger', bg: isGain ? 'bg-success/10' : 'bg-danger/10' },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-xl border border-border bg-card-solid p-3 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={cn('rounded-md p-1', card.bg)}>
                      <Icon size={12} className={card.color} />
                    </div>
                    <span className="text-xs text-muted">{card.label}</span>
                  </div>
                  <p className={cn('text-lg font-bold font-num', card.color)}>{card.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================
            FUNDAMENTALS / NEWS TABS
           ============================================ */}
        <div className="rounded-xl border border-border bg-card-solid overflow-hidden shadow-[var(--shadow-card)]">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {[
              { key: 'fundamentals' as DetailTab, label: 'Fundamentals', icon: BarChart2 },
              { key: 'news' as DetailTab, label: 'News', icon: Newspaper },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors',
                    activeTab === t.key
                      ? 'border-b-2 border-info text-foreground bg-gray-50/80'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            {/* ====== FUNDAMENTALS TAB ====== */}
            {activeTab === 'fundamentals' && (
              <div className="space-y-5">

                {/* Key Metrics Grid */}
                <div>
                  <h4 className="text-sm font-bold text-info uppercase tracking-wider mb-2">Key Metrics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Market Cap', value: fundamentals?.market_cap ? formatNumber(fundamentals.market_cap) : '—' },
                      { label: 'Total Shares', value: fundamentals?.total_shares ? formatVolume(fundamentals.total_shares) : '—' },
                      { label: '52W High', value: fundamentals?.week52_high ? `৳${fundamentals.week52_high.toFixed(2)}` : '—', color: 'text-success' },
                      { label: '52W Low', value: fundamentals?.week52_low ? `৳${fundamentals.week52_low.toFixed(2)}` : '—', color: 'text-danger' },
                      { label: 'P/E Ratio', value: fundamentals?.pe_ratio?.toFixed(2) || '—' },
                      { label: 'EPS (Annual)', value: fundamentals?.eps ? `৳${fundamentals.eps.toFixed(2)}` : '—', color: 'text-success' },
                      { label: 'NAV/Share', value: fundamentals?.nav ? `৳${fundamentals.nav.toFixed(2)}` : '—' },
                      { label: 'Face Value', value: fundamentals?.face_value ? `৳${fundamentals.face_value}` : '—' },
                      { label: 'Paid-up Capital', value: fundamentals?.paid_up_capital ? formatNumber(fundamentals.paid_up_capital) : '—' },
                      { label: 'Listing Year', value: fundamentals?.listing_year?.toString() || '—' },
                      { label: 'P/NAV', value: fundamentals?.nav && fundamentals.nav > 0 ? `${(stock.last_price / fundamentals.nav).toFixed(2)}x` : '—' },
                      { label: 'P/E x EPS', value: fundamentals?.eps && fundamentals?.pe_ratio ? `৳${(fundamentals.pe_ratio * fundamentals.eps).toFixed(2)}` : '—' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl border border-border bg-gray-50/80 p-3">
                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">{item.label}</p>
                        <p className={cn('text-lg font-bold font-num', item.color || 'text-foreground')}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 52W Range Visual */}
                {fundamentals?.week52_high && fundamentals?.week52_low && fundamentals.week52_high > fundamentals.week52_low && (
                  <div className="rounded-xl border border-border bg-gray-50/80 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">52 Week Range</span>
                      {fundamentals.nav && fundamentals.nav > 0 && (
                        <span className="text-xs text-muted">
                          Price/NAV: <span className={cn(
                            'font-bold font-num',
                            stock.last_price / fundamentals.nav > 1.5 ? 'text-danger'
                              : stock.last_price / fundamentals.nav < 1 ? 'text-success'
                              : 'text-warning'
                          )}>{(stock.last_price / fundamentals.nav).toFixed(2)}x</span>
                        </span>
                      )}
                    </div>
                    <div className="relative h-2.5 rounded-full overflow-hidden bg-border/30">
                      <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to right, #f6465d, #ffa502, #0ecb81)' }} />
                      <div
                        className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg transition-all duration-300"
                        style={{ left: `calc(${Math.max(0, Math.min(100, ((stock.last_price - fundamentals.week52_low) / (fundamentals.week52_high - fundamentals.week52_low)) * 100))}% - 2px)` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs">
                      <span className="text-danger font-num">৳{fundamentals.week52_low.toFixed(2)}</span>
                      <span className="text-muted">
                        <span className="font-num font-bold text-foreground">+{(((stock.last_price - fundamentals.week52_low) / fundamentals.week52_low) * 100).toFixed(1)}%</span> from low
                      </span>
                      <span className="text-success font-num">৳{fundamentals.week52_high.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Dividend History */}
                {dividends && dividends.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-info uppercase tracking-wider mb-2">Dividend History</h4>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-gray-50/80">
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Year</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted">Cash Div %</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted">Stock Div %</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Record Date</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">AGM Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {dividends.slice(0, 5).map((d: any) => (
                            <tr key={d.year} className="hover:bg-gray-50/80">
                              <td className="px-3 py-2 font-semibold">{d.year}</td>
                              <td className="px-3 py-2 text-right text-success font-medium font-num">
                                {d.cash_dividend != null ? `${d.cash_dividend}%` : '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-info font-medium font-num">
                                {d.stock_dividend != null ? `${d.stock_dividend}%` : '—'}
                              </td>
                              <td className="px-3 py-2 text-xs text-muted">{d.record_date || '—'}</td>
                              <td className="px-3 py-2 text-xs text-muted">{d.agm_date || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Financial Statements */}
                {financials && financials.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-info uppercase tracking-wider mb-2">Financial Statements</h4>

                    {/* Annual */}
                    {annualData.length > 0 && (
                      <div className="rounded-xl border border-border overflow-hidden mb-3">
                        <div className="px-4 py-2 bg-gray-50/80 border-b border-border">
                          <span className="text-xs font-bold text-muted uppercase tracking-wider">Annual</span>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[10px] text-muted uppercase tracking-wider border-b border-border">
                              <th className="px-4 py-2 text-left font-semibold">Year</th>
                              <th className="px-3 py-2 text-right font-semibold">EPS</th>
                              <th className="px-3 py-2 text-right font-semibold">NAV</th>
                              <th className="px-4 py-2 text-right font-semibold">Net Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {annualData.slice(0, 10).map((f: any, i: number) => (
                              <tr key={i} className="border-b border-border/30 hover:bg-gray-50/80 transition-colors">
                                <td className="px-4 py-2.5 font-semibold text-foreground">{f.year}</td>
                                <td className={cn('px-3 py-2.5 text-right font-num font-bold', f.eps >= 0 ? 'text-success' : 'text-danger')}>
                                  {f.eps?.toFixed(2) || '—'}
                                </td>
                                <td className="px-3 py-2.5 text-right font-num text-foreground">{f.nav?.toFixed(2) || '—'}</td>
                                <td className="px-4 py-2.5 text-right font-num text-muted">{f.net_profit ? formatNumber(f.net_profit) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Quarterly */}
                    {quarterlyData.length > 0 && (
                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-2 bg-gray-50/80 border-b border-border">
                          <span className="text-xs font-bold text-muted uppercase tracking-wider">Quarterly / Interim</span>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[10px] text-muted uppercase tracking-wider border-b border-border">
                              <th className="px-4 py-2 text-left font-semibold">Year</th>
                              <th className="px-3 py-2 text-left font-semibold">Period</th>
                              <th className="px-3 py-2 text-right font-semibold">EPS</th>
                              <th className="px-4 py-2 text-right font-semibold">NAV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quarterlyData.slice(0, 12).map((f: any, i: number) => (
                              <tr key={i} className="border-b border-border/30 hover:bg-gray-50/80 transition-colors">
                                <td className="px-4 py-2.5 font-semibold text-foreground">{f.year}</td>
                                <td className="px-3 py-2.5 text-muted">
                                  <span className="px-2 py-0.5 rounded bg-gray-50 text-xs font-bold">{f.period_type}</span>
                                </td>
                                <td className={cn('px-3 py-2.5 text-right font-num font-bold', f.eps >= 0 ? 'text-success' : 'text-danger')}>
                                  {f.eps?.toFixed(2) || '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right font-num text-foreground">{f.nav?.toFixed(2) || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* No fundamentals at all */}
                {!fundamentals && (!dividends || dividends.length === 0) && (!financials || financials.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted">
                    <Building2 size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No fundamental data available</p>
                  </div>
                )}
              </div>
            )}

            {/* ====== NEWS TAB ====== */}
            {activeTab === 'news' && (
              <div className="flex items-center justify-center py-12 text-muted">
                <div className="text-center">
                  <Newspaper size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Company news & announcements</p>
                  <p className="text-xs text-muted/50 mt-1">Coming soon for {stock.symbol}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacer for mobile nav */}
        <div className="h-16 sm:h-4" />
      </div>
    </div>
  );
}
