import { useMemo } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { useDemoCashLedger } from '@/hooks/useDemoCashLedger';
import { StatCard } from '@/components/ui/Card';
import { ActivityTimeline } from '@/components/portfolio/ActivityTimeline';
import { formatCurrency } from '@/lib/utils';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function CashLedgerPage() {
  const { demoAccount } = useDemo();
  const { data: entries } = useDemoCashLedger();

  const summary = useMemo(() => {
    if (!entries) return { totalCredits: 0, totalDebits: 0 };
    return {
      totalCredits: entries.reduce((s, e) => s + Number(e.credit), 0),
      totalDebits: entries.reduce((s, e) => s + Number(e.debit), 0),
    };
  }, [entries]);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">Cash Ledger</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Track every cash movement in your demo account</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <StatCard
            title="Available Cash"
            value={formatCurrency(demoAccount?.available_cash ?? 0)}
            icon={<Wallet size={20} />}
            iconColor="bg-[#0b8a00]/15 text-[#0b8a00]"
          />
          <StatCard
            title="Total Credits"
            value={formatCurrency(summary.totalCredits)}
            icon={<ArrowDownRight size={20} />}
            iconColor="bg-green-100 text-green-600"
          />
          <StatCard
            title="Total Debits"
            value={formatCurrency(summary.totalDebits)}
            icon={<ArrowUpRight size={20} />}
            iconColor="bg-red-100 text-red-600"
          />
        </div>

        {/* Uses shared ActivityTimeline component */}
        <ActivityTimeline />
      </div>
    </div>
  );
}
