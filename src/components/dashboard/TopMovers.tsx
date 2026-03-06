import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency, getChangeColor, cn } from '@/lib/utils';
import type { LivePrice, TopMoverTab } from '@/types';

interface Props {
  prices: LivePrice[];
}

const tabs: { key: TopMoverTab; label: string }[] = [
  { key: 'gainer', label: 'Top Gainer' },
  { key: 'loser', label: 'Top Loser' },
  { key: 'volume', label: 'Top Volume' },
  { key: 'value', label: 'Top Value' },
  { key: 'trade', label: 'Top Trade' },
];

function getSorted(prices: LivePrice[], tab: TopMoverTab): LivePrice[] {
  const arr = [...prices];
  switch (tab) {
    case 'gainer':
      return arr.filter(p => p.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct).slice(0, 10);
    case 'loser':
      return arr.filter(p => p.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 10);
    case 'volume':
      return arr.sort((a, b) => b.volume - a.volume).slice(0, 10);
    case 'value':
      return arr.sort((a, b) => b.value_traded - a.value_traded).slice(0, 10);
    case 'trade':
      return arr.sort((a, b) => b.trades - a.trades).slice(0, 10);
  }
}

export function TopMovers({ prices }: Props) {
  const [activeTab, setActiveTab] = useState<TopMoverTab>('gainer');
  const sorted = getSorted(prices, activeTab);

  return (
    <Card padding={false}>
      {/* Tabs */}
      <div className="flex gap-1 p-1.5 mx-4 mt-4 sm:mx-5 bg-surface rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-3 sm:px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all',
              activeTab === t.key
                ? 'bg-info text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs border-b border-border">
              <th className="px-4 sm:px-5 py-2.5 font-medium w-10">#</th>
              <th className="px-3 py-2.5 font-medium">Symbol</th>
              <th className="px-3 py-2.5 font-medium text-right">LTP</th>
              <th className="px-4 sm:px-5 py-2.5 font-medium text-right">CHG %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted text-sm">No data</td>
              </tr>
            ) : (
              sorted.map((p, i) => (
                <tr key={p.symbol} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                  <td className="px-4 sm:px-5 py-3 text-muted font-num">{i + 1}</td>
                  <td className="px-3 py-3 font-medium">{p.symbol}</td>
                  <td className="px-3 py-3 text-right font-num">{formatCurrency(p.ltp)}</td>
                  <td className={cn('px-4 sm:px-5 py-3 text-right font-num font-medium', getChangeColor(p.change_pct))}>
                    {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
