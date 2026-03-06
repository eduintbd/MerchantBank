import { Link } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/Card';
import { formatNumber, formatVolume, cn } from '@/lib/utils';
import {
  TrendingUp,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Users,
  BarChart3,
  ArrowRight,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Live Market Data',
    desc: 'Real-time DSE indices, stock prices, and market statistics updated every 30 seconds.',
    gradient: 'grad-info',
    color: 'text-info',
    bg: 'bg-info/15',
  },
  {
    icon: TrendingUp,
    title: 'Trade Stocks',
    desc: 'Buy and sell DSE-listed stocks with a simple, intuitive trading interface.',
    gradient: 'grad-success',
    color: 'text-success',
    bg: 'bg-success/15',
  },
  {
    icon: Briefcase,
    title: 'Portfolio Tracking',
    desc: 'Track your investments with real-time P/L calculations and performance charts.',
    gradient: 'grad-purple',
    color: 'text-purple',
    bg: 'bg-purple/15',
  },
  {
    icon: GraduationCap,
    title: 'Learning Academy',
    desc: 'Complete courses and quizzes to qualify for trading. Learn before you invest.',
    gradient: 'grad-warning',
    color: 'text-warning',
    bg: 'bg-warning/15',
  },
  {
    icon: ShieldCheck,
    title: 'KYC Verification',
    desc: 'Secure document verification process to comply with regulatory requirements.',
    gradient: 'grad-danger',
    color: 'text-danger',
    bg: 'bg-danger/15',
  },
  {
    icon: Users,
    title: 'Referral Program',
    desc: 'Earn commissions by referring friends. Track referrals and earnings in real-time.',
    gradient: 'grad-primary',
    color: 'text-info',
    bg: 'bg-info/15',
  },
];

export function LandingPage() {
  const { data: market } = useMarketData();

  const dsex = market?.indices.find(i => i.index_name === 'DSEX');
  const dses = market?.indices.find(i => i.index_name === 'DSES');
  const ds30 = market?.indices.find(i => i.index_name === 'DS30');

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar — fixed, same h-12 as TopNav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-12 glass border-b border-border flex items-center px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center text-white font-bold text-xs">
            H
          </div>
          <div>
            <span className="font-semibold text-sm">Hero</span>
            <p className="text-[9px] text-muted leading-none mt-0.5">Investment Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link to="/auth">
            <Button variant="primary" size="sm" icon={<ArrowRight size={14} />}>Sign Up</Button>
          </Link>
        </div>
      </nav>

      {/* Main — mirrors AppLayout exactly: pt-14 clears fixed nav, then inner padding */}
      <main className="pt-14">
        <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12">

          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-info/10 border border-info/20 text-info text-xs font-medium mb-5">
              <Activity size={14} className="animate-pulse" />
              Live DSE Market Data
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
              Smart Investing
              <br />
              <span className="bg-gradient-to-r from-info to-purple bg-clip-text text-transparent">Starts Here</span>
            </h1>
            <p className="mt-4 text-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Your all-in-one platform for trading on the Dhaka Stock Exchange. Real-time market data,
              portfolio tracking, learning academy, and more.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" icon={<ArrowRight size={16} />}>Get Started Free</Button>
              </Link>
              <a href="#market">
                <Button variant="secondary" size="lg" icon={<BarChart3 size={16} />}>View Market</Button>
              </a>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border mb-6 sm:mb-8" />

          {/* Live Market — same layout as Dashboard MarketOverview */}
          <section id="market" className="mb-6 sm:mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Live Market</h2>

            {market ? (
              <div className="animate-slide-up">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-4 sm:mb-5">
                  <StatCard
                    title="DSEX Index"
                    value={dsex ? dsex.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    icon={<TrendingUp size={20} />}
                    iconColor="bg-info/15 text-info"
                    gradient="grad-info"
                    trend={dsex ? { value: dsex.change_pct } : undefined}
                  />
                  <StatCard
                    title="DSES Index"
                    value={dses ? dses.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    icon={<TrendingUp size={20} />}
                    iconColor="bg-success/15 text-success"
                    gradient="grad-success"
                    trend={dses ? { value: dses.change_pct } : undefined}
                  />
                  <StatCard
                    title="DS30 Index"
                    value={ds30 ? ds30.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    icon={<TrendingUp size={20} />}
                    iconColor="bg-purple/15 text-purple"
                    gradient="grad-purple"
                    trend={ds30 ? { value: ds30.change_pct } : undefined}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Total Volume', value: formatVolume(market.stats.totalVolume), icon: BarChart3, color: 'text-info' },
                    { label: 'Total Trades', value: formatNumber(market.stats.totalTrades), icon: Activity, color: 'text-warning' },
                    { label: 'Advancers', value: String(market.stats.advancers), icon: ArrowUpCircle, color: 'text-success' },
                    { label: 'Decliners', value: String(market.stats.decliners), icon: ArrowDownCircle, color: 'text-danger' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-border bg-card/50 p-3 sm:p-4 text-center">
                      <s.icon size={18} className={cn(s.color, 'mx-auto mb-1.5')} />
                      <p className="text-lg sm:text-xl font-bold font-num">{s.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton rounded-2xl h-[120px] sm:h-[140px]" />
                ))}
              </div>
            )}
          </section>

          {/* Separator */}
          <div className="border-t border-border mb-6 sm:mb-8" />

          {/* Features */}
          <section className="mb-6 sm:mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Platform Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className={cn(
                    'rounded-2xl border border-border p-4 sm:p-5 animate-slide-up',
                    f.gradient
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', f.bg)}>
                    <f.icon size={20} className={f.color} />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{f.title}</h3>
                  <p className="text-muted text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Separator */}
          <div className="border-t border-border mb-6 sm:mb-8" />

          {/* CTA */}
          <section className="mb-6 sm:mb-8">
            <div className="rounded-2xl border border-border grad-info p-6 sm:p-10 text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Ready to Start Investing?</h2>
              <p className="text-muted mt-3 text-xs sm:text-sm">
                Join thousands of investors on Hero. Create your free account today.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/auth">
                  <Button size="lg" icon={<ArrowRight size={16} />}>Create Account</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="secondary" size="lg">Login</Button>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-5 px-4 sm:px-6 md:px-8 lg:px-12 text-center">
        <p className="text-muted text-xs">&copy; {new Date().getFullYear()} Hero Investment Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
