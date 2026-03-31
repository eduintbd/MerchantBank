import { useState } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { useDemoPortfolioSummary } from '@/hooks/useDemoPortfolio';
import { StatCard } from '@/components/ui/Card';
import { DemoPortfolioView } from '@/components/portfolio/DemoPortfolioView';
import { ActivityTimeline } from '@/components/portfolio/ActivityTimeline';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Wallet,
  Clock,
} from 'lucide-react';

type TabKey = 'holdings' | 'activity';

export function DemoPortfolioPage() {
  const { demoAccount } = useDemo();
  const { data: summary } = useDemoPortfolioSummary();
  const [activeTab, setActiveTab] = useState<TabKey>('holdings');

  const portfolioValue = (demoAccount?.available_cash ?? 0) + (summary?.totalMarketValue ?? 0);
  const totalPnl = (summary?.totalRealizedPnl ?? 0) + (summary?.totalUnrealizedPnl ?? 0);
  const totalPnlPct =
    demoAccount?.starting_cash && demoAccount.starting_cash > 0
      ? (totalPnl / demoAccount.starting_cash) * 100
      : 0;

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">Demo Portfolio</h1>
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#0b8a00]/10 text-[#0b8a00] border border-[#0b8a00]/20">
            Virtual
          </span>
        </div>
        <p className="text-gray-500 text-sm sm:text-base mt-1 mb-6 sm:mb-8">
          Track your demo holdings, activity, and position details
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Portfolio Value"
            value={formatCurrency(portfolioValue)}
            icon={<Briefcase size={20} />}
            iconColor="bg-[#0b8a00]/15 text-[#0b8a00]"
            trend={totalPnlPct !== 0 ? { value: totalPnlPct, label: 'vs starting' } : undefined}
          />
          <StatCard
            title="Available Cash"
            value={formatCurrency(demoAccount?.available_cash ?? 0)}
            icon={<Wallet size={20} />}
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Market Value"
            value={formatCurrency(summary?.totalMarketValue ?? 0)}
            icon={<BarChart3 size={20} />}
            iconColor="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Total P&L"
            value={formatCurrency(totalPnl)}
            icon={totalPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            iconColor={totalPnl >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto">
          {([
            { key: 'holdings' as TabKey, label: 'Holdings & Charts', icon: Briefcase },
            { key: 'activity' as TabKey, label: 'Activity Timeline', icon: Clock },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Holdings Tab — uses shared DemoPortfolioView component */}
        {activeTab === 'holdings' && <DemoPortfolioView />}

        {/* Activity Tab — uses shared ActivityTimeline component */}
        {activeTab === 'activity' && <ActivityTimeline />}
      </div>
    </div>
  );
}
