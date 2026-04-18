import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { MarketStats } from '@/types';

interface Props {
  stats: MarketStats;
}

const SEGMENTS = [
  { key: 'Advancers', color: '#22c55e', dotClass: 'bg-success' },
  { key: 'Decliners', color: '#ef4444', dotClass: 'bg-danger' },
  { key: 'Unchanged', color: '#6b7280', dotClass: 'bg-gray-500' },
] as const;

// Custom label renderer for percentage on each segment
function renderSegmentLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  if (percent < 0.05) return null; // skip tiny segments
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-bold font-num"
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

export function MarketStrength({ stats }: Props) {
  const data = [
    { name: 'Advancers', value: stats.advancers },
    { name: 'Decliners', value: stats.decliners },
    { name: 'Unchanged', value: stats.unchanged },
  ];

  return (
    <Card className="flex flex-col">
      <h3 className="text-sm font-semibold tracking-wide">Market Strength</h3>

      <div className="flex-1 flex items-center justify-center mt-2">
        <div className="relative w-[190px] h-[190px] sm:w-[210px] sm:h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="88%"
                dataKey="value"
                stroke="none"
                cornerRadius={4}
                paddingAngle={2}
                label={renderSegmentLabel}
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={SEGMENTS[i].color}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl sm:text-[34px] font-extrabold font-num leading-none text-foreground">
              {stats.totalStocks}
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-muted font-semibold mt-1">
              Total Stocks
            </span>
          </div>
        </div>
      </div>

      {/* Legend: horizontal pills */}
      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
        {data.map((d, i) => (
          <div
            key={d.name}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-xs"
          >
            <div className={cn('w-2 h-2 rounded-full', SEGMENTS[i].dotClass)} />
            <span className="text-muted font-medium">{d.name}</span>
            <span className="font-bold font-num text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
