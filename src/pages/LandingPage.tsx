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
  { icon: BarChart3, title: 'Live Market Data', desc: 'Real-time DSE indices, stock prices, and market statistics updated every 30 seconds.', color: 'text-info', bg: 'bg-info/15' },
  { icon: TrendingUp, title: 'Trade Stocks', desc: 'Buy and sell DSE-listed stocks with a simple, intuitive trading interface.', color: 'text-success', bg: 'bg-success/15' },
  { icon: Briefcase, title: 'Portfolio Tracking', desc: 'Track your investments with real-time P/L calculations and performance charts.', color: 'text-purple', bg: 'bg-purple/15' },
  { icon: GraduationCap, title: 'Learning Academy', desc: 'Complete courses and quizzes to qualify for trading. Learn before you invest.', color: 'text-warning', bg: 'bg-warning/15' },
  { icon: ShieldCheck, title: 'KYC Verification', desc: 'Secure document verification process to comply with regulatory requirements.', color: 'text-danger', bg: 'bg-danger/15' },
  { icon: Users, title: 'Referral Program', desc: 'Earn commissions by referring friends. Track referrals and earnings in real-time.', color: 'text-info', bg: 'bg-info/15' },
];

export function LandingPage() {
  const { data: market } = useMarketData();

  const dsex = market?.indices.find(i => i.index_name === 'DSEX');
  const dses = market?.indices.find(i => i.index_name === 'DSES');
  const ds30 = market?.indices.find(i => i.index_name === 'DS30');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-info/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-purple/6 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpeg" alt="HeroStock.AI" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-semibold text-sm">HeroStock.AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/our-story">
                <Button variant="ghost" size="sm">Our Story</Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/auth">
                <Button variant="primary" size="sm" icon={<ArrowRight size={14} />}>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-info/10 border border-info/20 text-info text-xs font-medium mb-6">
            <Activity size={14} className="animate-pulse" />
            Live DSE Market Data
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Smart Investing
            <br />
            <span className="bg-gradient-to-r from-info to-purple bg-clip-text text-transparent">Starts Here</span>
          </h1>
          <p className="mt-5 text-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Your all-in-one platform for trading on the Dhaka Stock Exchange. Real-time market data,
            portfolio tracking, learning academy, and more.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" icon={<ArrowRight size={16} />}>Get Started Free</Button>
            </Link>
            <a href="#market">
              <Button variant="secondary" size="lg" icon={<BarChart3 size={16} />}>View Market</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Live Market Preview */}
      <section id="market" className="relative pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Live Market</h2>
          </div>

          {/* Index Cards */}
          {market ? (
            <div className="animate-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-5">
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

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Volume', value: formatVolume(market.stats.totalVolume), icon: BarChart3, color: 'text-info' },
                  { label: 'Total Trades', value: formatNumber(market.stats.totalTrades), icon: Activity, color: 'text-warning' },
                  { label: 'Advancers', value: String(market.stats.advancers), icon: ArrowUpCircle, color: 'text-success' },
                  { label: 'Decliners', value: String(market.stats.decliners), icon: ArrowDownCircle, color: 'text-danger' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-card/50 p-4 text-center">
                    <s.icon size={18} className={cn(s.color, 'mx-auto mb-2')} />
                    <p className="text-lg sm:text-xl font-bold font-num">{s.value}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton rounded-2xl h-[140px]" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="relative pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">Everything You Need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card/50 p-4 sm:p-5 animate-slide-up hover:bg-card-hover transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', f.bg)}>
                  <f.icon size={18} className={f.color} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-xl border border-border grad-info p-6 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-bold">Ready to Start Investing?</h2>
            <p className="text-muted mt-2 text-xs sm:text-sm">
              Join thousands of investors on Hero. Create your free account today.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" icon={<ArrowRight size={16} />}>Create Account</Button>
              </Link>
              <Link to="/auth">
                <Button variant="secondary" size="lg">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-muted text-[10px]">&copy; {new Date().getFullYear()} HeroStock.AI &middot; Fintech Bangladesh &middot; DSE &amp; CSE</p>
      </footer>
    </div>
  );
}
