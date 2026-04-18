import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import {
  Moon, Users, BarChart3, ShieldCheck, BookOpen, Zap,
  Trophy, Wallet, PieChart, Bell, Rocket, Activity, Leaf,
} from 'lucide-react';

const moreItems = [
  { to: '/halal', icon: Moon, label: 'Halal Stocks', desc: 'Shariah-compliant investments', color: 'text-success', bg: 'bg-success/10' },
  { to: '/women-investors', icon: Users, label: 'Women Investors', desc: 'Empowering women in finance', color: 'text-purple', bg: 'bg-purple/10' },
  { to: '/market-history', icon: BarChart3, label: 'Market History', desc: 'DSEX historical data & charts', color: 'text-info', bg: 'bg-info/10' },
  { to: '/ipo', icon: Rocket, label: 'IPO Center', desc: 'Upcoming & open IPOs', color: 'text-warning', bg: 'bg-warning/10' },
  { to: '/social', icon: Activity, label: 'Social Feed', desc: 'Discuss stocks with investors', color: 'text-info', bg: 'bg-info/10' },
  { to: '/bsec-rules', icon: ShieldCheck, label: 'BSEC Rules', desc: 'Regulations & compliance', color: 'text-danger', bg: 'bg-danger/10' },
  { to: '/trader-bios', icon: BookOpen, label: 'Trader Bios', desc: 'Legendary investor profiles', color: 'text-gold', bg: 'bg-warning/10' },
  { to: '/investor-journey', icon: Zap, label: 'Investor Journey', desc: 'Gamified learning journey', color: 'text-warning', bg: 'bg-warning/10' },
  { to: '/investors', icon: Trophy, label: 'Top Investors', desc: 'Leaderboard & profiles', color: 'text-success', bg: 'bg-success/10' },
  { to: '/finance', icon: Wallet, label: 'Finance Tracker', desc: 'Track income & expenses', color: 'text-info', bg: 'bg-info/10' },
  { to: '/portfolio/analysis', icon: PieChart, label: 'Portfolio Analysis', desc: 'Risk & diversification tools', color: 'text-purple', bg: 'bg-purple/10' },
  { to: '/notifications/settings', icon: Bell, label: 'Notifications', desc: 'Alert preferences', color: 'text-muted', bg: 'bg-black/5' },
  { to: '/stock/GP', icon: Activity, label: 'Stock Detail', desc: 'Detailed stock analysis', color: 'text-foreground', bg: 'bg-black/5' },
];

export function MorePage() {
  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">More Features</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Explore all Abaci Investments tools and resources</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {moreItems.map(item => (
          <Link key={item.to} to={item.to}>
            <Card hover className="!p-4 sm:!p-5 h-full">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                <item.icon size={20} className={item.color} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>      </div>

    </div>
  );
}