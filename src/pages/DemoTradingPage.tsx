import { useState } from 'react';
import { useStocks } from '@/hooks/useStocks';
import { useDemo } from '@/contexts/DemoContext';
import { DemoOrderTicket } from '@/components/trading/DemoOrderTicket';
import { DemoOpenOrders } from '@/components/trading/DemoOpenOrders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercent, getChangeColor, cn } from '@/lib/utils';
import { Search, TrendingUp, TrendingDown, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Stock } from '@/types';

export function DemoTradingPage() {
  const { demoAccount } = useDemo();
  const [search, setSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const { data: stocks, isLoading: stocksLoading } = useStocks(search);

  function handleSelectStock(stock: Stock) {
    setSelectedStock(stock);
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">Demo Trading</h1>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#0b8a00]/10 text-[#0b8a00] border border-[#0b8a00]/20">
              Virtual
            </span>
          </div>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Practice buying and selling DSE stocks with virtual money
            {demoAccount && (
              <span className="ml-2 font-num text-[#0b8a00] font-medium">
                Cash: {formatCurrency(demoAccount.available_cash)}
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Stock List */}
          <div className="lg:col-span-2">
            <div className="relative mb-5 sm:mb-6">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by symbol or company name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/30 focus:border-[#0b8a00]/30 shadow-sm transition-all"
              />
            </div>

            <Card padding={false} className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200 bg-gray-50/80">
                      <th className="px-5 sm:px-6 py-3.5 font-medium">Symbol</th>
                      <th className="px-3 py-3.5 font-medium text-right">Price</th>
                      <th className="px-3 py-3.5 font-medium text-right">Change</th>
                      <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Volume</th>
                      <th className="px-3 py-3.5 font-medium text-center">Action</th>
                      <th className="px-3 py-3.5 font-medium text-center w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {stocksLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center">
                          <Loader2 size={20} className="animate-spin text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-500">Loading stocks...</span>
                        </td>
                      </tr>
                    ) : stocks?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-500">No stocks found</td>
                      </tr>
                    ) : (
                      stocks?.map((stock, idx) => (
                        <tr
                          key={stock.id}
                          className={cn(
                            'border-b border-gray-100 last:border-0 cursor-pointer transition-all duration-150 relative',
                            selectedStock?.id === stock.id
                              ? 'bg-[#0b8a00]/5 ring-1 ring-inset ring-[#0b8a00]/15'
                              : idx % 2 === 0 ? 'bg-transparent hover:bg-gray-50' : 'bg-gray-50/80 hover:bg-gray-50'
                          )}
                          onClick={() => handleSelectStock(stock)}
                        >
                          <td className="px-5 sm:px-6 py-4 relative">
                            <div className={cn(
                              'absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full',
                              stock.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                            )} />
                            <div className="font-semibold text-gray-900 tracking-tight">{stock.symbol}</div>
                            <div className="text-[11px] text-gray-500 truncate max-w-[120px] sm:max-w-[200px] mt-0.5">{stock.company_name}</div>
                          </td>
                          <td className="px-3 py-4 text-right font-num font-semibold text-gray-900">{formatCurrency(stock.last_price)}</td>
                          <td className="px-3 py-4 text-right">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-num',
                              stock.change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            )}>
                              {stock.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {formatPercent(stock.change_percent)}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-right font-num text-gray-500 text-xs hidden md:table-cell">
                            {stock.volume.toLocaleString()}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <Button size="sm" variant="ghost" className="text-[#0b8a00] hover:bg-[#0b8a00]/10 font-medium">
                              Trade
                            </Button>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <Link to={`/stock/${stock.symbol}`} className="text-gray-400 hover:text-[#0b8a00] transition-colors">
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

          {/* Order Panel + Open Orders — uses shared components */}
          <div className="space-y-5">
            <DemoOrderTicket
              stock={selectedStock}
              onClose={() => setSelectedStock(null)}
            />
            <DemoOpenOrders />
          </div>
        </div>
      </div>
    </div>
  );
}
