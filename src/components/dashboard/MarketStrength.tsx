import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { MarketStats } from '@/types';

interface Props {
  stats: MarketStats;
}

const COLORS = ['#22c55e', '#ef4444', '#6b7280'];

export function MarketStrength({ stats }: Props) {
  const data = [
    { name: 'Advancers', value: stats.advancers },
    { name: 'Decliners', value: stats.decliners },
    { name: 'Unchanged', value: stats.unchanged },
  ];

  return (
    <Card className="flex flex-col">
      <h3 className="text-sm font-semibold mb-4">Market Strength</h3>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="85%"
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-num">{stats.totalStocks}</span>
            <span className="text-[10px] text-muted">Stocks</span>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-4">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-xs text-muted">{d.name}</span>
            <span className="text-xs font-semibold font-num">{d.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
