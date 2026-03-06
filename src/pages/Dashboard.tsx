import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/useStocks';
import { useLearningProgress } from '@/hooks/useLearning';
import { useMarketingSummary } from '@/hooks/useMarketing';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import {
  TrendingUp,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Wallet,
  Target,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { data: learning } = useLearningProgress();
  const { data: marketing } = useMarketingSummary();

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            Hi, {user?.full_name?.split(' ')[0] || 'Investor'}
          </h1>
          <p className="text-muted text-sm sm:text-base mt-1">Your investment overview</p>
        </div>
        <Badge status={user?.kyc_status || 'pending'} label={`KYC: ${user?.kyc_status || 'pending'}`} pulse />
      </div>

      {/* Market Overview */}
      <MarketOverview />

      {/* Separator */}
      <div className="my-6 sm:my-8 border-t border-border" />

      {/* Your Portfolio */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Your Portfolio</h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(portfolio?.current_value || 0)}
          icon={<Briefcase size={20} />}
          iconColor="bg-info/15 text-info"
          gradient="grad-info"
          trend={portfolio ? { value: portfolio.total_profit_loss_percent } : undefined}
        />
        <StatCard
          title="Total Invested"
          value={formatCurrency(portfolio?.total_invested || 0)}
          subtitle={`${portfolio?.total_stocks || 0} stocks`}
          icon={<Wallet size={20} />}
          iconColor="bg-success/15 text-success"
          gradient="grad-success"
        />
        <StatCard
          title="Learning"
          value={`${learning?.progressPercent || 0}%`}
          subtitle={learning?.isQualified ? 'Qualified' : 'In progress'}
          icon={<GraduationCap size={20} />}
          iconColor="bg-warning/15 text-warning"
          gradient="grad-warning"
        />
        <StatCard
          title="Referral Earnings"
          value={formatCurrency(marketing?.total_commission || 0)}
          subtitle={`${marketing?.total_referrals || 0} referrals`}
          icon={<Gift size={20} />}
          iconColor="bg-purple/15 text-purple"
          gradient="grad-purple"
        />
      </div>

      {/* Alerts Section */}
      {(user?.kyc_status !== 'verified' || (learning && !learning.isQualified)) && (
        <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Action Required</h2>

          {user?.kyc_status !== 'verified' && (
            <div className="rounded-xl border border-warning/15 grad-warning p-4 sm:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} className="text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-warning">Complete KYC</p>
                <p className="text-xs text-muted mt-0.5">Submit documents to start trading</p>
              </div>
              <Link to="/kyc">
                <Button variant="secondary" size="sm" icon={<ChevronRight size={14} />}>Go</Button>
              </Link>
            </div>
          )}

          {learning && !learning.isQualified && (
            <div className="rounded-xl border border-info/15 grad-info p-4 sm:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-info/15 flex items-center justify-center shrink-0">
                <GraduationCap size={22} className="text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-info">Complete Courses</p>
                <p className="text-xs text-muted mt-0.5">{learning.completedLessons}/{learning.totalLessons} lessons done</p>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-2.5">
                  <div className="bg-info h-1.5 rounded-full transition-all" style={{ width: `${learning.progressPercent}%` }} />
                </div>
              </div>
              <Link to="/learning">
                <Button variant="secondary" size="sm" icon={<ChevronRight size={14} />}>Go</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {[
            { to: '/trading', icon: TrendingUp, label: 'Trade', color: 'text-success', bg: 'bg-success/10' },
            { to: '/portfolio', icon: BarChart3, label: 'Portfolio', color: 'text-info', bg: 'bg-info/10' },
            { to: '/marketing', icon: Target, label: 'Refer & Earn', color: 'text-warning', bg: 'bg-warning/10' },
          ].map(item => (
            <Link key={item.to} to={item.to}>
              <Card hover className="text-center !py-7 sm:!py-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-3`}>
                  <item.icon size={24} className={item.color} />
                </div>
                <p className="text-sm sm:text-base font-semibold">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Holdings Preview */}
      {portfolio && portfolio.items.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Holdings</h2>
              <Link to="/portfolio" className="text-xs text-info hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted text-xs border-b border-border">
                    <th className="px-5 sm:px-6 py-3 text-left font-medium">Stock</th>
                    <th className="px-3 py-3 text-right font-medium">Qty</th>
                    <th className="px-3 py-3 text-right font-medium hidden sm:table-cell">Price</th>
                    <th className="px-5 sm:px-6 py-3 text-right font-medium">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.items.slice(0, 5).map(item => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-5 sm:px-6 py-4">
                        <span className="font-medium text-foreground">{item.stock_symbol}</span>
                      </td>
                      <td className="px-3 py-4 text-right font-num text-muted">{item.quantity}</td>
                      <td className="px-3 py-4 text-right font-num text-muted hidden sm:table-cell">{formatCurrency(item.current_price)}</td>
                      <td className={`px-5 sm:px-6 py-4 text-right font-num font-medium ${getChangeColor(item.profit_loss_percent)}`}>
                        {formatPercent(item.profit_loss_percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
