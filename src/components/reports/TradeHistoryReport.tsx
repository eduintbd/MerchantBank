import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { Download, Search, Loader2, FileText } from 'lucide-react';
import { useTradeHistory } from '@/hooks/useDemoReports';
import type { TradeReport } from '@/types/demo';

export function TradeHistoryReport() {
  const { data: trades, isLoading } = useTradeHistory();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');

  const filtered = useMemo(() => {
    if (!trades) return [];
    return trades.filter((t) => {
      if (searchSymbol && !t.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
      if (dateFrom && t.trade_time < dateFrom) return false;
      if (dateTo && t.trade_time > dateTo + 'T23:59:59') return false;
      return true;
    });
  }, [trades, dateFrom, dateTo, searchSymbol]);

  function exportCsv() {
    if (!filtered.length) return;
    const headers = ['Date', 'Symbol', 'Side', 'Qty', 'Price', 'Gross', 'Charges', 'Net'];
    const rows = filtered.map((t) => [
      new Date(t.trade_time).toLocaleString(),
      t.symbol,
      t.side,
      t.quantity,
      t.price.toFixed(2),
      t.gross_amount.toFixed(2),
      t.charges.toFixed(2),
      t.net_amount.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalGross = filtered.reduce((s, t) => s + t.gross_amount, 0);
  const totalCharges = filtered.reduce((s, t) => s + t.charges, 0);
  const totalNet = filtered.reduce((s, t) => s + (t.side === 'BUY' ? -t.net_amount : t.net_amount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading trade history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Search Symbol</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                placeholder="e.g. BEXIMCO"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/20 focus:border-[#0b8a00]/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/20 focus:border-[#0b8a00]/40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/20 focus:border-[#0b8a00]/40"
            />
          </div>
          <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={exportCsv} disabled={!filtered.length}>
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Turnover</p>
          <p className="text-lg font-bold font-num text-gray-900 mt-1">{formatCurrency(totalGross)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Charges</p>
          <p className="text-lg font-bold font-num text-red-600 mt-1">{formatCurrency(totalCharges)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Net Cash Flow</p>
          <p className={cn('text-lg font-bold font-num mt-1', totalNet >= 0 ? 'text-green-700' : 'text-red-700')}>
            {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200 bg-gray-50/80">
                <th className="px-5 py-3.5 font-medium">Date</th>
                <th className="px-3 py-3.5 font-medium">Symbol</th>
                <th className="px-3 py-3.5 font-medium">Side</th>
                <th className="px-3 py-3.5 font-medium text-right">Qty</th>
                <th className="px-3 py-3.5 font-medium text-right">Price</th>
                <th className="px-3 py-3.5 font-medium text-right">Gross</th>
                <th className="px-3 py-3.5 font-medium text-right">Charges</th>
                <th className="px-5 py-3.5 font-medium text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <FileText size={28} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No trades found for the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((trade, idx) => (
                  <tr key={idx} className={cn('border-b border-gray-100 last:border-0', idx % 2 === 1 && 'bg-gray-50/50')}>
                    <td className="px-5 py-3 text-xs text-gray-600 font-num">{formatDateTime(trade.trade_time)}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900">{trade.symbol}</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        trade.side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-num">{trade.quantity}</td>
                    <td className="px-3 py-3 text-right font-num">{formatCurrency(trade.price)}</td>
                    <td className="px-3 py-3 text-right font-num">{formatCurrency(trade.gross_amount)}</td>
                    <td className="px-3 py-3 text-right font-num text-red-600">{formatCurrency(trade.charges)}</td>
                    <td className="px-5 py-3 text-right font-num font-medium">{formatCurrency(trade.net_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
