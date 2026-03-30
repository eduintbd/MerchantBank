import {
  Wallet,
  ShoppingCart,
  Briefcase,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';
import { StatCard } from '@/components/ui/Card';
import { ExplainerTooltip } from '@/components/ui/ExplainerTooltip';
import { formatCurrency, getChangeColor } from '@/lib/utils';

export function DemoAccountSummary() {
  const { demoAccount } = useDemo();

  if (!demoAccount) return null;

  const portfolioValue = demoAccount.available_cash + demoAccount.market_value;
  const totalPnl = demoAccount.unrealized_pnl + demoAccount.realized_pnl;
  const todayChangePercent =
    demoAccount.starting_cash > 0
      ? ((portfolioValue - demoAccount.starting_cash) / demoAccount.starting_cash) * 100
      : 0;

  const stats = [
    {
      title: 'Virtual Cash Balance',
      value: formatCurrency(demoAccount.available_cash),
      icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconColor: 'bg-blue-100 text-blue-600',
      tooltip:
        'The amount of simulated cash available in your demo account. This is not real money.',
    },
    {
      title: 'Buying Power',
      value: formatCurrency(demoAccount.buying_power),
      icon: <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconColor: 'bg-emerald-100 text-emerald-600',
      tooltip:
        'The maximum amount you can use to buy stocks. This accounts for pending orders and any margin restrictions.',
    },
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(portfolioValue),
      icon: <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconColor: 'bg-purple-100 text-purple-600',
      tooltip:
        'Your total portfolio value is the sum of your cash balance and the current market value of all your holdings.',
      trend: { value: todayChangePercent, label: 'since start' },
    },
    {
      title: 'Unrealized P&L',
      value: formatCurrency(demoAccount.unrealized_pnl),
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconColor:
        demoAccount.unrealized_pnl >= 0
          ? 'bg-emerald-100 text-emerald-600'
          : 'bg-red-100 text-red-600',
      tooltip:
        'Profit or loss on positions you still hold. This changes as market prices move. It becomes "realized" only when you sell.',
      className: getChangeColor(demoAccount.unrealized_pnl),
    },
    {
      title: 'Realized P&L',
      value: formatCurrency(demoAccount.realized_pnl),
      icon: <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconColor:
        demoAccount.realized_pnl >= 0
          ? 'bg-emerald-100 text-emerald-600'
          : 'bg-red-100 text-red-600',
      tooltip:
        'Profit or loss from positions you have already closed (sold). This is your actual locked-in gain or loss.',
      className: getChangeColor(demoAccount.realized_pnl),
    },
    {
      title: "Today's Change",
      value: formatCurrency(totalPnl),
      icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconColor:
        totalPnl >= 0
          ? 'bg-emerald-100 text-emerald-600'
          : 'bg-red-100 text-red-600',
      tooltip:
        'The combined unrealized and realized profit or loss reflecting how your portfolio has performed overall.',
      trend: { value: todayChangePercent, label: 'overall' },
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div key={stat.title} className="relative">
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
            trend={stat.trend}
          />
          <div className="absolute top-3 right-14 sm:top-3.5 sm:right-16">
            <ExplainerTooltip term={stat.title}>
              <p>{stat.tooltip}</p>
            </ExplainerTooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
