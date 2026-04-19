import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Briefcase, GraduationCap, BarChart3, PlayCircle,
  ArrowRight, Activity, ChevronRight, BookOpen, Shield,
  Menu, X, AlertTriangle, Brain, Target, Layers,
} from 'lucide-react';

/* ─── Design tokens (Groww-inspired) ─── */
const T = {
  bg:        '#ffffff',
  bgLight:   '#f8f8f8',
  bgCard:    'rgba(255,255,255,0.85)',
  accent:    '#00b386',
  accentDim: 'rgba(0,179,134,0.08)',
  accentHover: '#00a87d',
  blue:      '#5367ff',
  amber:     '#d97706',
  amberBg:   '#fffbeb',
  amberBorder: '#fde68a',
  white:     '#ffffff',
  title:     '#121212',
  titleSub:  '#7c7e8c',
  text:      '#44475b',
  border:    '#e9e9eb',
  borderLight: '#f0f0f2',
  fontTitle: "'Inter', sans-serif",
  fontBody:  "'Inter', sans-serif",
  fontMono:  "'JetBrains Mono', monospace",
  radius:    16,
  radiusSm:  10,
  radiusPill: 99,
};

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How It Works' },
  { href: '#academy', label: 'Academy' },
];

const FEATURES = [
  {
    icon: TrendingUp, title: 'Demo Trading Simulator',
    desc: 'Place virtual buy/sell orders on 300+ DSE-listed stocks. Experience the full order lifecycle — market orders, limit orders, fills, rejections, and cancellations — all with virtual money.',
  },
  {
    icon: Briefcase, title: 'Portfolio Tracker',
    desc: 'Track your virtual holdings with real-time DSE prices. See unrealized/realized P&L, sector allocation, average cost, and position breakdowns — just like a real brokerage account.',
  },
  {
    icon: GraduationCap, title: 'Abaci Academy — 5 Courses, 20 Lessons',
    desc: 'Structured courses on stock market basics, DSE indices, technical analysis (RSI, MACD, candlesticks), fundamental analysis (EPS, P/E, NAV), and risk management.',
  },
  {
    icon: PlayCircle, title: 'End-of-Day Replay Engine',
    desc: 'Understand what happens after market close: order expiry, trade booking, charge posting, cash settlement, and daily statements. Step through each EOD event with explanations.',
  },
  {
    icon: Brain, title: 'Coaching & Mistake Detection',
    desc: 'Automated alerts for overtrading, portfolio concentration, chasing losses, and poor risk discipline. Contextual coaching with links to relevant lessons.',
  },
];

const STEPS = [
  {
    num: '01', title: 'Start Instantly',
    desc: 'No signup or registration needed. You get ৳100,000 virtual BDT the moment you open the platform. Start exploring immediately.',
  },
  {
    num: '02', title: 'Learn & Practice',
    desc: 'Complete Abaci Academy courses to understand how the DSE works. Place demo trades, study your portfolio, and run end-of-day simulations.',
  },
  {
    num: '03', title: 'Build Readiness',
    desc: 'Track your readiness score across 5 dimensions: lessons completed, quiz scores, trades placed, EOD replays viewed, and mistakes avoided.',
  },
];

const COURSES = [
  { emoji: '📚', title: 'Stock Market Basics', lessons: 5, required: true },
  { emoji: '🏛️', title: 'Understanding DSE & CSE', lessons: 4, required: true },
  { emoji: '📊', title: 'Technical Analysis', lessons: 4, required: false },
  { emoji: '🔍', title: 'Fundamental Analysis', lessons: 3, required: false },
  { emoji: '🛡️', title: 'Risk Management', lessons: 4, required: true },
];

const DISCLAIMER = 'IMPORTANT DISCLAIMER: Abaci Investments is an educational demo trading platform designed for learning purposes only. No real money is involved. No real securities transactions are executed. All trades are simulated using virtual currency (৳100,000 virtual BDT). Abaci Investments is not a registered broker, dealer, or investment adviser. This platform does not provide investment advice. Past simulated performance does not guarantee future results. Real trading involves substantial risk of loss. Please consult a licensed financial adviser before investing real money.';

/* ─── Component ─── */
export function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div style={{ fontFamily: T.fontBody, color: T.text, background: T.bg, overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>

      {/* ══════════ NAVBAR ══════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: T.white, fontWeight: 700, fontSize: 18 }}>A</span></div>
            <div>
              <div style={{ fontFamily: T.fontTitle, fontWeight: 600, color: T.title, fontSize: 16, lineHeight: 1.2 }}>Abaci Investments</div>
              <div style={{ fontSize: 10, color: T.amber, fontWeight: 600, lineHeight: 1 }}>Demo Trading & Learning</div>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 32 }} className="hidden md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: T.titleSub, textDecoration: 'none', transition: 'color .3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = T.titleSub)}>
                {l.label}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/market" className="hidden sm:block" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: T.titleSub, textDecoration: 'none', borderRadius: T.radiusPill }}>
              Market Data
            </Link>
            <Link to="/dashboard" className="hidden sm:flex" style={{
              padding: '10px 22px', fontSize: 13, fontWeight: 600, color: T.white,
              background: T.accent, borderRadius: T.radiusPill, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'background .3s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = T.accentHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.accent)}>
              Go to Dashboard <ArrowRight size={14} />
            </Link>
            <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden"
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: T.radiusSm, border: 'none', background: mobileNav ? T.bgLight : 'transparent', cursor: 'pointer' }}>
              {mobileNav ? <X size={22} color={T.title} /> : <Menu size={22} color={T.title} />}
            </button>
          </div>
        </div>

        {mobileNav && (
          <div className="md:hidden" style={{ background: T.bgLight, borderTop: `1px solid ${T.border}` }}>
            <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileNav(false)}
                  style={{ padding: '14px 20px', fontSize: 15, fontWeight: 500, color: T.titleSub, textDecoration: 'none', borderBottom: `1px solid ${T.borderLight}` }}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 10, borderTop: `1px solid ${T.border}` }}>
              <Link to="/market" onClick={() => setMobileNav(false)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, color: T.titleSub, background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusPill, textDecoration: 'none', textAlign: 'center' }}>
                Market Data
              </Link>
              <Link to="/dashboard" onClick={() => setMobileNav(false)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, color: T.white, background: T.accent, borderRadius: T.radiusPill, textDecoration: 'none', textAlign: 'center' }}>
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </header>

      {mobileNav && (
        <div className="md:hidden" onClick={() => setMobileNav(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)' }} />
      )}

      {/* ══════════ DISCLAIMER BANNER ══════════ */}
      <div style={{
        marginTop: 64, background: T.amberBg, borderBottom: `1px solid ${T.amberBorder}`,
        padding: '12px 16px',
      }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertTriangle size={18} color={T.amber} style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            <strong>This is a demo trading & learning platform.</strong> No real money is involved. No real orders are placed on any exchange.
            All trades use virtual currency (৳100,000 BDT). Abaci Investments is not a brokerage or investment adviser.
          </p>
        </div>
      </div>

      {/* ══════════ HERO ══════════ */}
      <section style={{
        minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center',
        background: T.bg,
        position: 'relative',
      }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 2 }} className="py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: T.radiusPill, background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', marginBottom: 28 }}>
                <Shield size={13} color={T.amber} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.amber }}>Demo Platform — No Real Money</span>
              </div>

              <h1 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', color: T.title, margin: 0 }}>
                Learn the<br />
                <span style={{ color: T.accent }}>Bangladesh</span><br />
                Stock Market
              </h1>

              <p style={{ marginTop: 20, color: T.text, lineHeight: 1.75, maxWidth: 500 }} className="text-sm sm:text-base lg:text-[17px]">
                Practice trading 300+ DSE stocks with ৳100,000 virtual BDT. Complete structured courses on market fundamentals, technical analysis, and risk management.
                No signup needed — start instantly.
              </p>

              <div style={{ marginTop: 28 }} className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Link to="/dashboard" style={{
                  padding: '14px 30px', fontSize: 15, fontWeight: 700, color: T.white,
                  background: T.accent, borderRadius: T.radiusPill, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .3s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.accentHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = T.accent)}>
                  Start Demo Trading <ArrowRight size={16} />
                </Link>
                <Link to="/learning" style={{
                  padding: '14px 30px', fontSize: 15, fontWeight: 600, color: T.titleSub,
                  background: 'transparent', border: `1px solid ${T.border}`,
                  borderRadius: T.radiusPill, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color .3s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#b0b2ba')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                  <GraduationCap size={16} /> Explore Academy
                </Link>
              </div>

              <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
                {['৳100K Virtual BDT', '300+ DSE Stocks', '20 Free Lessons', 'No Signup Required'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: T.titleSub }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Logo + highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div className="w-32 sm:w-40 lg:w-48 aspect-square" style={{ borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px rgba(0,179,134,0.25)' }}>
                <span style={{ color: T.white, fontWeight: 800, fontSize: '4rem' }}>A</span>
              </div>

              <div style={{ width: '100%', background: T.bgCard, borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.titleSub, marginBottom: 16 }}>What You'll Learn</div>
                {[
                  { icon: BarChart3, text: 'How DSE indices (DSEX, DSES, DS30) work' },
                  { icon: TrendingUp, text: 'Market & limit orders, order lifecycle' },
                  { icon: Briefcase, text: 'Portfolio P&L, charges, and settlements' },
                  { icon: Target, text: 'Technical indicators: RSI, MACD, candlesticks' },
                  { icon: Layers, text: 'Position sizing, stop-loss, diversification' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.borderLight}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={14} color={T.accent} />
                    </div>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bgLight }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>Platform Features</div>
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, margin: '0 0 14px' }}>Everything you need to learn trading</h2>
            <p style={{ fontSize: 16, color: T.titleSub, maxWidth: 520, margin: '0 auto' }}>A complete simulated brokerage environment for Bangladesh stock market education.</p>
          </div>
          <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: T.bgCard, borderRadius: 20, padding: '28px',
                border: `1px solid ${T.border}`, transition: 'border-color .3s, transform .3s, box-shadow .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7c8ce'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <f.icon size={20} color={T.accent} />
                </div>
                <h3 style={{ fontFamily: T.fontTitle, fontSize: 16, fontWeight: 600, color: T.title, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bg }}>
        <div style={{ width: '95%', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>How It Works</div>
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, margin: '0 0 14px' }}>Three steps to market literacy</h2>
          </div>
          <div style={{ display: 'grid', gap: 24 }} className="grid-cols-1 md:grid-cols-3">
            {STEPS.map(s => (
              <div key={s.num} style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: T.accentDim, border: `2px solid ${T.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  fontFamily: T.fontMono, fontSize: 18, fontWeight: 800, color: T.accent,
                }}>{s.num}</div>
                <h3 style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 600, color: T.title, margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ACADEMY PREVIEW ══════════ */}
      <section id="academy" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bgLight }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
              <GraduationCap size={18} color={T.accent} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Abaci Academy</span>
            </div>
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, margin: '0 0 14px' }}>5 Courses. 20 Lessons. Completely Free.</h2>
            <p style={{ fontSize: 16, color: T.titleSub, maxWidth: 520, margin: '0 auto' }}>Structured education on the Bangladesh stock market — from absolute beginner to informed investor.</p>
          </div>
          <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {COURSES.map(c => (
              <div key={c.title} style={{
                background: T.bgCard, borderRadius: 20, padding: '24px 20px', textAlign: 'center',
                border: `1px solid ${T.border}`, transition: 'transform .3s, box-shadow .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{c.emoji}</div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: T.title, margin: '0 0 6px' }}>{c.title}</h3>
                <p style={{ fontSize: 12, color: T.titleSub, margin: '0 0 8px' }}>{c.lessons} lessons</p>
                {c.required && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#eb5b3c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Required</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link to="/learning" style={{
              padding: '14px 28px', background: T.accent, color: T.white,
              fontWeight: 700, fontSize: 15, borderRadius: T.radiusPill, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background .3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = T.accentHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.accent)}>
              Start Learning <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bg, textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px' }}>
          <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, margin: '0 0 14px' }}>Ready to learn trading?</h2>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.65, margin: '0 0 36px' }}>
            No signup. No fees. No risk. Start with ৳100,000 virtual BDT and learn the full trading lifecycle.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            <Link to="/dashboard" style={{
              padding: '14px 32px', fontSize: 15, fontWeight: 700, color: T.white,
              background: T.accent, borderRadius: T.radiusPill, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'background .3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = T.accentHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.accent)}>
              Start Demo Trading <ArrowRight size={16} />
            </Link>
            <Link to="/market" style={{
              padding: '14px 28px', fontSize: 15, fontWeight: 600, color: T.titleSub,
              background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: T.radiusPill, textDecoration: 'none', transition: 'border-color .3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#b0b2ba')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
              Browse Market Data
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: T.bgLight, padding: '56px 0 32px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: T.white, fontWeight: 700, fontSize: 16 }}>A</span></div>
            <div>
              <div style={{ fontFamily: T.fontTitle, fontWeight: 600, fontSize: 15, color: T.title }}>Abaci Investments</div>
              <div style={{ fontSize: 10, color: T.amber, fontWeight: 600 }}>Demo Trading & Learning Platform</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 20px', marginBottom: 36 }} className="sm:!grid-cols-4 sm:!gap-x-24">
            {[
              { title: 'Platform', links: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Demo Trading', href: '/demo/trading' }, { label: 'Portfolio', href: '/demo/portfolio' }] },
              { title: 'Learn', links: [{ label: 'Abaci Academy', href: '/learning' }, { label: 'Market Data', href: '/market' }, { label: 'EOD Replay', href: '/demo/eod' }] },
              { title: 'Tools', links: [{ label: 'Cash Ledger', href: '/demo/ledger' }, { label: 'Reports', href: '/demo/reports' }, { label: 'Halal Stocks', href: '/halal' }] },
              { title: 'More', links: [{ label: 'DSE History', href: '/market-history' }, { label: 'BSEC Rules', href: '/bsec-rules' }, { label: 'Investor Bios', href: '/trader-bios' }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.titleSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{col.title}</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link to={l.href} style={{ fontSize: 13, color: T.text, textDecoration: 'none', transition: 'color .3s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.text)}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* DISCLAIMER */}
          <div style={{
            background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 12,
            padding: '16px 20px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertTriangle size={16} color={T.amber} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
                {DISCLAIMER}
              </p>
            </div>
          </div>

          <p style={{ fontSize: 11, color: T.titleSub }}>
            &copy; {new Date().getFullYear()} Abaci Investments — Demo Trading & Learning Platform. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
