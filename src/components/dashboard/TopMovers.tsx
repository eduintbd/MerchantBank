import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency, getChangeColor, cn } from '@/lib/utils';
import type { LivePrice, TopMoverTab } from '@/types';

interface Props {
  prices: LivePrice[];
}

const tabs: { key: TopMoverTab; label: string }[] = [
  { key: 'gainer', label: 'Gainers' },
  { key: 'loser', label: 'Losers' },
  { key: 'volume', label: 'Volume' },
  { key: 'value', label: 'Value' },
  { key: 'trade', label: 'Trades' },
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
      {/* Tab bar with underline indicator */}
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex gap-0 border-b border-border overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'relative px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors',
                activeTab === t.key
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground/70'
              )}
            >
              {t.label}
              {/* Active underline */}
              {activeTab === t.key && (
                <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-info" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-muted uppercase tracking-wider">
              <th className="pl-4 sm:pl-5 pr-2 py-2.5 font-medium w-8">#</th>
              <th className="px-2 py-2.5 font-medium">Symbol</th>
              <th className="px-2 py-2.5 font-medium text-right">LTP (BDT)</th>
              <th className="pl-2 pr-4 sm:pr-5 py-2.5 font-medium text-right">CHG%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted text-sm">No data available</td>
              </tr>
            ) : (
              sorted.map((p, i) => {
                const isGain = p.change_pct > 0;
                const isLoss = p.change_pct < 0;
                return (
                  <tr
                    key={p.symbol}
                    className="border-t border-border/50 hover:bg-card-hover/50 transition-colors group"
                  >
                    {/* Rank with colored left bar */}
                    <td className="pl-4 sm:pl-5 pr-2 py-2.5 relative">
                      <div
                        className={cn(
                          'absolute left-0 top-1 bottom-1 w-[3px] rounded-full',
                          isGain ? 'bg-success' : isLoss ? 'bg-danger' : 'bg-border'
                        )}
                      />
                      <span className="text-[11px] text-muted/60 font-num">{i + 1}</span>
                    </td>

                    {/* Symbol + company name placeholder */}
                    <td className="px-2 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-[13px] leading-tight">{p.symbol}</span>
                        <span className="text-[10px] text-muted leading-tight mt-0.5 truncate max-w-[140px]">
                          {p.symbol}
                        </span>
                      </div>
                    </td>

                    {/* LTP */}
                    <td className="px-2 py-2.5 text-right">
                      <span className="font-num tabular-nums text-[13px] font-medium text-foreground">
                        {formatCurrency(p.ltp)}
                      </span>
                    </td>

                    {/* CHG% pill badge */}
                    <td className="pl-2 pr-4 sm:pr-5 py-2.5 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center min-w-[64px] px-2.5 py-1 rounded-full text-xs font-bold font-num tabular-nums',
                          isGain && 'bg-success/15 text-success',
                          isLoss && 'bg-danger/15 text-danger',
                          !isGain && !isLoss && 'bg-white/5 text-muted'
                        )}
                      >
                        {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
