import { useState } from 'react';
import { TradeHistoryReport } from '@/components/reports/TradeHistoryReport';
import { PnlReport } from '@/components/reports/PnlReport';
import { PerformanceTrend } from '@/components/reports/PerformanceTrend';
import { MistakeLog } from '@/components/reports/MistakeLog';
import { cn } from '@/lib/utils';
import { FileText, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

const TABS = [
  { key: 'trades', label: 'Trade History', icon: FileText },
  { key: 'pnl', label: 'P&L', icon: BarChart3 },
  { key: 'performance', label: 'Performance', icon: TrendingUp },
  { key: 'mistakes', label: 'Mistakes', icon: AlertTriangle },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function DemoReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('trades');

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">Reports Center</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Analyze your trading activity, performance, and areas for improvement
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-6 sm:mb-8 overflow-x-auto">
          {TABS.map((tab) => {
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

        {/* Tab Content */}
        <div>
          {activeTab === 'trades' && <TradeHistoryReport />}
          {activeTab === 'pnl' && <PnlReport />}
          {activeTab === 'performance' && <PerformanceTrend />}
          {activeTab === 'mistakes' && <MistakeLog />}
        </div>
      </div>
    </div>
  );
}
