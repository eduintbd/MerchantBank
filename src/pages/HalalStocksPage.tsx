import { useMemo } from 'react';
import halalSymbols from '@/data/halal-stocks.json';
import { useStocks } from '@/hooks/useStocks';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent, getChangeColor, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Moon } from 'lucide-react';

export function HalalStocksPage() {
  const { data: stocks, isLoading } = useStocks();

  const halalSet = useMemo(() => new Set(halalSymbols), []);
  const halalStocks = useMemo(
    () => stocks?.filter(s => halalSet.has(s.symbol)) || [],
    [stocks, halalSet]
  );

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Moon size={24} className="text-info" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Shariah-Compliant Stocks</h1>
        </div>
        <p className="text-muted text-sm sm:text-base mt-1">
          DSE listed stocks that comply with Islamic Shariah principles
        </p>
      </div>

      <Card className="mb-5 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold">Total Halal Stocks</p>
            <p className="text-xl sm:text-2xl font-bold font-num mt-1">{halalSymbols.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center">
            <Moon size={22} />
          </div>
        </div>
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-border">
                <th className="px-5 sm:px-6 py-3.5 font-medium">Symbol</th>
                <th className="px-3 py-3.5 font-medium hidden sm:table-cell">Company</th>
                <th className="px-3 py-3.5 font-medium text-right">Price</th>
                <th className="px-3 py-3.5 font-medium text-right">Change</th>
                <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-2 border-info border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading halal stocks...</span>
                    </div>
                  </td>
                </tr>
              ) : halalStocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">No halal stocks found</td>
                </tr>
              ) : (
                halalStocks.map(stock => (
                  <tr key={stock.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                    <td className="px-5 sm:px-6 py-4">
                      <div className="font-medium text-foreground">{stock.symbol}</div>
                    </td>
                    <td className="px-3 py-4 hidden sm:table-cell">
                      <div className="text-xs text-muted truncate max-w-[180px]">{stock.company_name}</div>
                    </td>
                    <td className="px-3 py-4 text-right font-num font-medium">{formatCurrency(stock.last_price)}</td>
                    <td className={cn('px-3 py-4 text-right font-num font-medium', getChangeColor(stock.change))}>
                      <div className="flex items-center justify-end gap-1">
                        {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {formatPercent(stock.change_percent)}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right font-num text-muted hidden md:table-cell">
                      {stock.volume.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>      </div>

    </div>
  );
}