import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Globe,
  TrendingUp,
  Award,
  Users,
  Target,
  Zap,
  BarChart3,
  GraduationCap,
  ChevronRight,
  BrainCircuit,
  Bell,
  CandlestickChart,
  Wallet,
  Banknote,
  Rocket,
  Eye,
  Sparkles,
  ArrowUpRight,
  Activity,
  Crosshair,
} from 'lucide-react';

/* ── timeline milestones ─────────────────────────────────── */
const milestones = [
  {
    year: 'Zero',
    title: 'Starting From Nothing',
    desc: 'Abul Khayer enters the capital market with zero connections, zero capital — armed only with determination.',
    icon: Zap,
    color: 'text-warning',
    bg: 'bg-warning/15',
    border: 'border-warning/30',
  },
  {
    year: 'Grind',
    title: 'The Learning Years',
    desc: 'Years studying DSE & CSE markets — every pattern, every regulation, every nuance. Failing, adapting, growing stronger.',
    icon: GraduationCap,
    color: 'text-info',
    bg: 'bg-info/15',
    border: 'border-info/30',
  },
  {
    year: 'Rise',
    title: 'Capital Market Hero',
    desc: 'Recognized as "পুঁজিবাজার হিরো" — featured in national publications, invited to speak at capital market conferences.',
    icon: Award,
    color: 'text-purple',
    bg: 'bg-purple/15',
    border: 'border-purple/30',
  },
  {
    year: 'Global',
    title: 'International Connections',
    desc: 'Forging partnerships with global fintech leaders — bringing world-class methodologies back to Bangladesh.',
    icon: Globe,
    color: 'text-success',
    bg: 'bg-success/15',
    border: 'border-success/30',
  },
  {
    year: 'Build',
    title: 'Abaci Investments is Born',
    desc: 'The vision becomes reality — Bangladesh\'s first AI-powered investment platform. Not just another OMS, but a global contender.',
    icon: BrainCircuit,
    color: 'text-info',
    bg: 'bg-info/15',
    border: 'border-info/30',
  },
  {
    year: 'Hero',
    title: 'From Zero to Hero',
    desc: 'Full DSE & CSE integration, BRAC Bank digital onboarding, AI-driven analytics, and a growing community of investors.',
    icon: TrendingUp,
    color: 'text-warning',
    bg: 'bg-warning/15',
    border: 'border-warning/30',
  },
];

/* ── zerodha-inspired platform features ──────────────────── */
const platformFeatures = [
  {
    icon: Banknote,
    title: 'Zero Brokerage',
    desc: 'Zero brokerage on equity delivery trades. No hidden charges — keep more of your returns.',
    highlight: 'BDT 0',
    color: 'text-success',
    bg: 'bg-success/15',
  },
  {
    icon: CandlestickChart,
    title: 'Hero Kite',
    desc: 'Lightning-fast order placement, advanced charts, multi-timeframe analysis, and one-click trading.',
    highlight: '<1s',
    color: 'text-info',
    bg: 'bg-info/15',
  },
  {
    icon: GraduationCap,
    title: 'Hero Varsity',
    desc: 'The most comprehensive free stock market education platform in Bangladesh. Bengali & English.',
    highlight: '50+',
    color: 'text-warning',
    bg: 'bg-warning/15',
  },
  {
    icon: BrainCircuit,
    title: 'Hiru Forecast',
    desc: 'AI reads chart patterns, predicts price movements, marks entry/exit/stop-loss with confidence scores.',
    highlight: 'AI',
    color: 'text-purple',
    bg: 'bg-purple/15',
  },
  {
    icon: Bell,
    title: 'Hero Sentinel',
    desc: 'Intelligent price alerts via push, SMS, or email. Never miss an opportunity.',
    highlight: '24/7',
    color: 'text-danger',
    bg: 'bg-danger/15',
  },
  {
    icon: Wallet,
    title: 'Hero Console',
    desc: 'Detailed P&L reports, tax statements, trade journal, dividend tracking, and portfolio health score.',
    highlight: '360°',
    color: 'text-info',
    bg: 'bg-info/15',
  },
];

/* ── hiru forecast capabilities ──────────────────────────── */
const forecastCapabilities = [
  {
    icon: CandlestickChart,
    title: 'Pattern Recognition',
    desc: '50+ chart patterns detected in real-time — Head & Shoulders, Cup & Handle, Flags, and more.',
    color: 'text-info',
    bg: 'bg-info/15',
  },
  {
    icon: Eye,
    title: 'Trend Prediction',
    desc: 'AI forecasts bullish/bearish movements — see where a stock is likely heading in 1 day, 1 week, or 1 month.',
    color: 'text-success',
    bg: 'bg-success/15',
  },
  {
    icon: Crosshair,
    title: 'Entry & Exit Signals',
    desc: 'Automatic support/resistance detection with entry points, targets, and stop-loss zones.',
    color: 'text-warning',
    bg: 'bg-warning/15',
  },
  {
    icon: Activity,
    title: 'Volume & Momentum',
    desc: 'Combines RSI, MACD, Bollinger Bands with AI to confirm signals. Only high-confidence setups.',
    color: 'text-purple',
    bg: 'bg-purple/15',
  },
];

/* ── stats ───────────────────────────────────────────────── */
const stats = [
  { label: 'DSE Stocks', value: '350+', icon: BarChart3 },
  { label: 'Exchanges', value: 'DSE & CSE', icon: Target },
  { label: 'Community', value: '10,000+', icon: Users },
];

/* ── main component ─────────────────────────────────────── */
export function OurStoryPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-info/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-purple/6 rounded-full blur-3xl" />
      </div>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.jpeg" alt="Abaci Investments" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-semibold text-sm">Abaci Investments</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">Home</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={<ArrowRight size={14} />}>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-5">
            <Award size={13} />
            পুঁজিবাজার হিরো &mdash; Capital Market Hero
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            From Zero
            <br />
            <span className="bg-gradient-to-r from-info via-purple to-primary bg-clip-text text-transparent">
              To Hero
            </span>
          </h1>
          <p className="mt-4 text-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            The story of <strong className="text-foreground">Abul Khayer</strong> — from nothing to building
            Bangladesh's most advanced AI-powered investment platform.
          </p>

          {/* Stats */}
          <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg sm:text-xl font-bold font-num">{s.value}</p>
                <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Origin Story ─────────────────────────────────── */}
      <section className="relative pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border grad-info p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-info" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Where It All Began</h2>
            </div>
            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>
                <strong className="text-foreground">Abul Khayer</strong> didn't come from wealth or connections.
                He taught himself the markets from the ground up — every chart pattern, every BSEC regulation.
                While others relied on outdated OMS platforms, he was studying how Zerodha disrupted India,
                how Robinhood democratized trading, and asking: <em>why can't Bangladesh have this?</em>
              </p>
              <p>
                His dedication earned him the title
                <strong className="text-info"> "পুঁজিবাজার হিরো"</strong>. He founded
                <strong className="text-info"> Abaci Investments</strong> — zero brokerage, Kite-style trading,
                Varsity-inspired education, AI-powered signals, and seamless BRAC Bank onboarding — all in
                one platform that rivals anything in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ───────────────────────────────────────── */}
      <section className="relative pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">The Journey</h2>

          <div className="relative">
            <div className="absolute left-5 sm:left-7 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-5">
              {milestones.map((m, i) => (
                <div
                  key={m.year}
                  className="relative pl-14 sm:pl-18 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={cn(
                    'absolute left-0 top-0 w-10 h-10 sm:w-14 sm:h-14 rounded-lg flex flex-col items-center justify-center border',
                    m.bg, m.border
                  )}>
                    <m.icon size={14} className={m.color} />
                    <span className={cn('text-[9px] font-bold mt-0.5', m.color)}>{m.year}</span>
                  </div>

                  <div className="rounded-lg border border-border bg-card/50 p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-1">{m.title}</h3>
                    <p className="text-muted text-xs sm:text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Ecosystem ────────────────────────────── */}
      <section className="relative pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-medium mb-3">
              <Rocket size={13} />
              Inspired by Zerodha &mdash; Built for Bangladesh
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">The Hero Ecosystem</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {platformFeatures.map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card/50 p-4 sm:p-5 animate-slide-up hover:bg-card-hover transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', f.bg)}>
                    <f.icon size={18} className={f.color} />
                  </div>
                  <span className={cn('text-base font-bold font-num', f.color)}>{f.highlight}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hiru Forecast ────────────────────────────────── */}
      <section className="relative pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple/10 border border-purple/20 text-purple text-xs font-medium mb-3">
              <Sparkles size={13} className="animate-pulse" />
              AI-Powered &mdash; Exclusive to Abaci Investments
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Hiru Forecast</h2>
            <p className="text-muted mt-1.5 text-xs sm:text-sm max-w-xl mx-auto">
              Bangladesh's first AI stock forecasting engine — detecting patterns, predicting trends,
              and marking entry/exit points with confidence scores.
            </p>
          </div>

          {/* Chart mockup */}
          <div className="rounded-xl border border-purple/20 bg-card/80 p-3 sm:p-5 animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-purple/15 flex items-center justify-center">
                  <BrainCircuit size={14} className="text-purple" />
                </div>
                <div>
                  <p className="text-xs font-semibold">BSRMSTEEL &mdash; DSE</p>
                  <p className="text-[9px] text-muted">Hiru Forecast &middot; Live</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-success/15 text-success text-[9px] font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> BULLISH
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple/15 text-purple text-[9px] font-bold">
                  87%
                </span>
              </div>
            </div>

            <div className="relative w-full aspect-[3/1] sm:aspect-[4/1]">
              <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hiru-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="hiru-predict" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 80, 120, 160].map(y => (
                  <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}

                {/* Historical area */}
                <path
                  d="M0,150 L60,145 L120,130 L180,135 L240,120 L300,110 L360,100 L420,90 L480,75 L520,68 L540,55 L540,200 L0,200 Z"
                  fill="url(#hiru-grad)"
                />
                <polyline
                  points="0,150 60,145 120,130 180,135 240,120 300,110 360,100 420,90 480,75 520,68 540,55"
                  fill="none" stroke="rgb(139,92,246)" strokeWidth="2" strokeLinejoin="round"
                />

                {/* Pattern zone */}
                <rect x="360" y="45" width="180" height="65" rx="3" fill="rgba(139,92,246,0.06)" stroke="rgba(139,92,246,0.2)" strokeWidth="1" strokeDasharray="5,3" />
                <text x="368" y="58" fontSize="8" fill="rgb(139,92,246)" fontWeight="600" fontFamily="system-ui">CUP &amp; HANDLE</text>

                {/* Prediction divider */}
                <line x1="540" y1="10" x2="540" y2="190" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3" />

                {/* Predicted area */}
                <path d="M540,55 L600,46 L660,38 L720,28 L780,20 L800,16 L800,200 L540,200 Z" fill="url(#hiru-predict)" />
                <polyline
                  points="540,55 600,46 660,38 720,28 780,20 800,16"
                  fill="none" stroke="rgb(34,197,94)" strokeWidth="2" strokeLinejoin="round" strokeDasharray="6,3" className="animate-pulse"
                />

                {/* Confidence bands */}
                <polyline points="540,50 600,38 660,28 720,16 780,6 800,0" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="1" strokeDasharray="2,2" />
                <polyline points="540,60 600,54 660,48 720,40 780,34 800,32" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="1" strokeDasharray="2,2" />

                {/* Entry marker */}
                <circle cx="540" cy="55" r="4" fill="rgb(139,92,246)" stroke="white" strokeWidth="1" />
                <text x="522" y="48" fontSize="7" fill="rgb(139,92,246)" fontWeight="600" fontFamily="system-ui" textAnchor="end">ENTRY ৳85.50</text>

                {/* Target marker */}
                <circle cx="780" cy="20" r="4" fill="rgb(34,197,94)" stroke="white" strokeWidth="1" />
                <text x="710" y="14" fontSize="7" fill="rgb(34,197,94)" fontWeight="600" fontFamily="system-ui">TARGET ৳98.20</text>

                {/* Stop loss */}
                <line x1="500" y1="70" x2="600" y2="70" stroke="rgba(239,68,68,0.4)" strokeWidth="1" strokeDasharray="3,2" />
                <text x="605" y="73" fontSize="6" fill="rgba(239,68,68,0.6)" fontFamily="system-ui">SL ৳80</text>
              </svg>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] sm:text-[10px] text-muted">
              <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 rounded-full bg-purple" /> Historical</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 rounded-full bg-success" /> Prediction</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple" /> Entry</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Target</span>
            </div>
          </div>

          {/* Capabilities */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
            {forecastCapabilities.map((c, i) => (
              <div
                key={c.title}
                className="rounded-xl border border-border bg-card/50 p-3 sm:p-4 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', c.bg)}>
                  <c.icon size={16} className={c.color} />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm mb-0.5">{c.title}</h3>
                <p className="text-muted text-[10px] sm:text-xs leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder + CTA ────────────────────────────────── */}
      <section className="relative pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Founder */}
          <div className="rounded-xl border border-border bg-card/50 p-5 sm:p-6 animate-slide-up">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary via-info to-purple flex items-center justify-center text-white font-bold text-xl shrink-0">
                AK
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">Abul Khayer</h3>
                <p className="text-info text-xs font-medium">Founder & CEO</p>
                <p className="text-primary/70 text-[10px] font-medium mt-0.5">পুঁজিবাজার হিরো — Capital Market Hero</p>
              </div>
            </div>
            <p className="text-muted text-xs sm:text-sm leading-relaxed">
              From zero to hero — Abul Khayer started with nothing but a vision to transform Bangladesh's capital market.
              Featured in national publications, connected with global fintech leaders, he founded Abaci Investments to give
              every Bangladeshi investor access to world-class trading tools.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-border grad-info p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold">Be Part of the Story</h2>
            <p className="text-muted mt-2 text-xs sm:text-sm max-w-md mx-auto">
              Join thousands of investors who trust Abaci Investments to navigate the Bangladesh capital market.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link to="/dashboard">
                <Button size="lg" icon={<ArrowRight size={16} />}>Start Investing</Button>
              </Link>
              <Link to="/">
                <Button variant="secondary" size="lg" icon={<ChevronRight size={16} />}>Explore</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-muted text-[10px]">
          &copy; {new Date().getFullYear()} Abaci Investments &middot; DSE &amp; CSE &middot; BRAC Bank Digital Onboarding &middot; BSEC Compliant
        </p>
      </footer>
    </div>
  );
}
