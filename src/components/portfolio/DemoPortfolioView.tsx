import { useState } from 'react';
import { Briefcase, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { cn, formatCurrency, getChangeColor } from '@/lib/utils';
import { useDemo } from '@/contexts/DemoContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDemoPortfolio } from '@/hooks/useDemoPortfolio';
import { DemoPositionDetail } from '@/components/portfolio/DemoPositionDetail';
import type { DemoPosition } from '@/types/demo';

const SECTOR_COLORS = [
  '#0b8a00', '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#0891b2', '#4f46e5', '#059669', '#d97706', '#6366f1',
];

export function DemoPortfolioView() {
  const { demoAccount } = useDemo();
  const { data: positions, isLoading } = useDemoPortfolio();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const holdings = positions || [];
  const totalMarketValue = holdings.reduce((s, p) => s + Number(p.market_value), 0);
  const totalUnrealizedPnl = holdings.reduce((s, p) => s + Number(p.unrealized_pnl), 0);
  const totalRealizedPnl = holdings.reduce((s, p) => s + Number(p.realized_pnl), 0);

  // Sector allocation data for pie chart
  const sectorMap = new Map<string, number>();
  for (const pos of holdings) {
    const sector = pos.company_name || pos.symbol;
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + Number(pos.market_value));
  }
  const sectorData = Array.from(sectorMap.entries()).map(([name, value]) => ({ name, value }));

  // Cash vs Holdings
  const cashBalance = demoAccount?.available_cash || 0;
  const cashVsHoldings = [
    { name: 'Cash', value: cashBalance },
    { name: 'Holdings', value: totalMarketValue },
  ];

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  // Empty state
  if (holdings.length === 0) {
    return (
      <Card>
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No positions yet</h3>
          <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
            You haven't placed any trades yet. Start with your first order!
          </p>
          <Link to="/demo/trading">
            <Button>Place Your First Order</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="!p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Holdings Value</p>
          <p className="text-lg font-bold font-num text-gray-900 mt-1">{formatCurrency(totalMarketValue)}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cash Balance</p>
          <p className="text-lg font-bold font-num text-gray-900 mt-1">{formatCurrency(cashBalance)}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unrealized P&L</p>
          <p className={cn('text-lg font-bold font-num mt-1', getChangeColor(totalUnrealizedPnl))}>
            {formatCurrency(totalUnrealizedPnl)}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Realized P&L</p>
          <p className={cn('text-lg font-bold font-num mt-1', getChangeColor(totalRealizedPnl))}>
            {formatCurrency(totalRealizedPnl)}
          </p>
        </Card>
      </div>

      {/* Holdings table */}
      <Card padding={false}>
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Holdings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Company</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Avg Cost</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider">Mkt Price</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Mkt Value</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider">Unrealized</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Realized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {holdings.map((pos: DemoPosition) => {
                const pnlPercent = Number(pos.avg_cost) > 0
                  ? ((Number(pos.market_price) - Number(pos.avg_cost)) / Number(pos.avg_cost)) * 100
                  : 0;

                return (
                  <tr
                    key={pos.id}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedSymbol(pos.symbol)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{pos.symbol}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 hidden sm:table-cell truncate max-w-[140px]">
                      {pos.company_name || '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-num tabular-nums text-gray-900">
                      {pos.quantity}
                    </td>
                    <td className="px-3 py-3 text-right font-num tabular-nums text-gray-700 hidden md:table-cell">
                      {formatCurrency(pos.avg_cost)}
                    </td>
                    <td className="px-3 py-3 text-right font-num tabular-nums text-gray-900">
                      {formatCurrency(pos.market_price)}
                    </td>
                    <td className="px-3 py-3 text-right font-num tabular-nums text-gray-700 hidden lg:table-cell">
                      {formatCurrency(pos.market_value)}
                    </td>
                    <td className={cn('px-3 py-3 text-right font-num tabular-nums font-medium', getChangeColor(Number(pos.unrealized_pnl)))}>
                      <span>{formatCurrency(pos.unrealized_pnl)}</span>
                      <span className="block text-[10px] opacity-75">
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 text-right font-num tabular-nums font-medium hidden lg:table-cell', getChangeColor(Number(pos.realized_pnl)))}>
                      {formatCurrency(pos.realized_pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sector Allocation Pie */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Allocation by Stock</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((_entry, index) => (
                    <Cell key={index} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {sectorData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[11px]">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                />
                <span className="text-gray-600 truncate max-w-[100px]">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Cash vs Holdings */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Cash vs Holdings</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cashVsHoldings}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#6b7280" />
                  <Cell fill="#0b8a00" />
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              <span className="text-gray-600">Cash ({formatCurrency(cashBalance)})</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0b8a00]" />
              <span className="text-gray-600">Holdings ({formatCurrency(totalMarketValue)})</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Position Detail Modal */}
      {selectedSymbol && (
        <DemoPositionDetail
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}
