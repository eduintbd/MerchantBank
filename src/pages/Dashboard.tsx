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
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Investor'}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-muted text-sm sm:text-base">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <span className="text-border">|</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Market Open
              </span>
            </div>
          </div>
        </div>
        <Badge status={user?.kyc_status || 'pending'} label={`KYC: ${user?.kyc_status || 'pending'}`} pulse />
      </div>

      {/* Market Overview */}
      <MarketOverview />

      {/* Separator */}
      <div className="my-8 sm:my-10 border-t border-border" />

      {/* Your Portfolio */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-[0.12em]">Your Portfolio</h2>
      </div>
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
        <div className="mt-8 sm:mt-10 space-y-3">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-[0.12em]">Action Required</h2>

          {user?.kyc_status !== 'verified' && (
            <div className="rounded-xl bg-card-solid border border-border p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-warning">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Complete KYC Verification</p>
                <p className="text-xs text-muted mt-0.5">Submit your documents to unlock trading</p>
              </div>
              <Link to="/kyc">
                <Button variant="secondary" size="sm" icon={<ChevronRight size={14} />}>Go</Button>
              </Link>
            </div>
          )}

          {learning && !learning.isQualified && (
            <div className="rounded-xl bg-card-solid border border-border p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-info">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Complete Learning Modules</p>
                <p className="text-xs text-muted mt-0.5">{learning.completedLessons}/{learning.totalLessons} lessons completed</p>
                <div className="w-full bg-border/40 rounded-full h-1.5 mt-2.5">
                  <div className="bg-info h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${learning.progressPercent}%` }} />
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
      <div className="mt-8 sm:mt-10">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-[0.12em] mb-4 sm:mb-5">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {[
            { to: '/trading', icon: TrendingUp, label: 'Trade', color: 'text-success', bg: 'bg-success/10', desc: 'Buy & sell stocks' },
            { to: '/portfolio', icon: BarChart3, label: 'Portfolio', color: 'text-info', bg: 'bg-info/10', desc: 'View holdings' },
            { to: '/marketing', icon: Target, label: 'Refer & Earn', color: 'text-warning', bg: 'bg-warning/10', desc: 'Invite friends' },
          ].map(item => (
            <Link key={item.to} to={item.to}>
              <Card hover className="text-center !py-8 sm:!py-10 group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110`}>
                  <item.icon size={26} className={item.color} />
                </div>
                <p className="text-sm sm:text-base font-semibold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted mt-0.5 hidden sm:block">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Holdings Preview */}
      {portfolio && portfolio.items.length > 0 && (
        <div className="mt-8 sm:mt-10">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Top Holdings</h2>
              <Link to="/portfolio" className="text-xs text-info hover:text-info/80 transition-colors flex items-center gap-1 font-medium">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-border bg-white/[0.02]">
                    <th className="px-5 sm:px-6 py-3 text-left font-medium w-10">#</th>
                    <th className="px-2 py-3 text-left font-medium">Stock</th>
                    <th className="px-3 py-3 text-right font-medium">Qty</th>
                    <th className="px-3 py-3 text-right font-medium hidden sm:table-cell">Price</th>
                    <th className="px-5 sm:px-6 py-3 text-right font-medium">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.items.slice(0, 5).map((item, idx) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.03] transition-colors duration-150 group">
                      <td className="px-5 sm:px-6 py-4 text-xs text-muted font-medium">{idx + 1}</td>
                      <td className="px-2 py-4">
                        <span className="font-semibold text-foreground tracking-tight">{item.stock_symbol}</span>
                      </td>
                      <td className="px-3 py-4 text-right font-num text-muted">{item.quantity}</td>
                      <td className="px-3 py-4 text-right font-num text-muted hidden sm:table-cell">{formatCurrency(item.current_price)}</td>
                      <td className="px-5 sm:px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-num ${
                          item.profit_loss_percent >= 0
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {formatPercent(item.profit_loss_percent)}
                        </span>
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
