import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { formatNumber, formatVolume, cn } from '@/lib/utils';
import { GlobalExchangeComparison } from '@/components/dashboard/GlobalExchangeComparison';
import {
  TrendingUp, Briefcase, GraduationCap, ShieldCheck, Users, BarChart3,
  ArrowRight, Activity, ArrowUpCircle, ArrowDownCircle, CheckCircle2,
  ChevronRight, BookOpen, Zap, Lock, Menu, X,
} from 'lucide-react';

/* ─── Design tokens (Light theme) ──────────────── */
const T = {
  bg:        '#ffffff',
  bgLight:   '#f8f9fb',
  bgCard:    'rgba(255,255,255,0.85)',
  accent:    '#05a003',
  accentDim: 'rgba(5,160,3,0.08)',
  blue:      '#2563eb',
  white:     '#ffffff',
  title:     '#111827',
  titleSub:  '#6b7280',
  text:      '#374151',
  border:    'rgba(0,0,0,0.08)',
  fontTitle: "'Ubuntu', sans-serif",
  fontBody:  "'Inter', sans-serif",
  fontMono:  "'JetBrains Mono', monospace",
  radius:    16,
  radiusSm:  10,
};

/* ─── Static data ─────────────────────────────────────────── */
const NAV_LINKS = [
  { href: '#market', label: 'Market' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#features', label: 'Features' },
  { href: '#learn', label: 'Academy' },
];

const STATS = [
  { value: '10,000+', label: 'Active Investors' },
  { value: '৳250 Cr+', label: 'Volume Traded' },
  { value: '300+', label: 'DSE Stocks' },
  { value: 'BSEC', label: 'Regulated' },
];

const PRICING = [
  { value: '৳0', label: 'Account Opening', sub: 'Free forever' },
  { value: '৳0', label: 'Annual Maintenance', sub: 'No hidden charges' },
  { value: '0.5%', label: 'Brokerage', sub: 'Per trade, flat fee' },
  { value: 'Free', label: 'Learning Academy', sub: 'All courses included' },
];

const FEATURES = [
  { icon: BarChart3, title: 'Real-time DSE Data', desc: 'Live DSEX, DSES, DS30 indices and stock prices updated every 30 seconds.' },
  { icon: TrendingUp, title: 'Stock Trading', desc: 'Buy and sell DSE-listed stocks with a simple, intuitive trading interface.' },
  { icon: Briefcase, title: 'Portfolio Tracking', desc: 'Monitor your investments with real-time P/L calculations and charts.' },
  { icon: GraduationCap, title: 'Hero Academy', desc: 'Free courses on DSE fundamentals. Learn before you invest.' },
  { icon: ShieldCheck, title: 'KYC & Compliance', desc: 'BSEC-compliant identity verification. Your data is always protected.' },
  { icon: Users, title: 'Referral Program', desc: 'Earn commissions by referring friends. Track earnings in real-time.' },
];

const TRUST = [
  { label: 'BSEC Regulated' },
  { label: 'DSE Member' },
  { label: 'CDBL Participant' },
];

const WHY = [
  { icon: Zap, title: 'No hidden fees', desc: '৳0 account opening, ৳0 AMC. Only pay when you trade.' },
  { icon: Lock, title: 'Bank-grade security', desc: 'Your investments are safe with 256-bit SSL encryption.' },
  { icon: BookOpen, title: 'Education first', desc: 'Complete free courses before unlocking live trading.' },
  { icon: ShieldCheck, title: 'BSEC regulated', desc: 'Fully licensed and regulated by Bangladesh securities law.' },
];

/* ─── Component ───────────────────────────────────────────── */
export function LandingPage() {
  const { data: market } = useMarketData();
  const [mobileNav, setMobileNav] = useState(false);
  const dsex = market?.indices.find(i => i.index_name === 'DSEX');
  const dses = market?.indices.find(i => i.index_name === 'DSES');
  const ds30 = market?.indices.find(i => i.index_name === 'DS30');

  return (
    <div style={{ fontFamily: T.fontBody, color: T.text, background: T.bg, overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>

      {/* ══════════ NAVBAR ══════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" style={{ width: 40, height: 40, borderRadius: T.radiusSm, objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: T.fontTitle, fontWeight: 700, color: T.title, fontSize: 16, lineHeight: 1.2 }}>HeroStock.AI</div>
              <div style={{ fontSize: 10, color: T.titleSub, lineHeight: 1 }}>Fintech Bangladesh</div>
            </div>
          </div>

          {/* Nav links — desktop */}
          <nav style={{ display: 'flex', gap: 36 }} className="hidden md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: T.titleSub, textDecoration: 'none', transition: 'color .3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = T.titleSub)}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTAs + Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/auth" className="hidden sm:block" style={{ padding: '8px 18px', fontSize: 14, fontWeight: 500, color: T.titleSub, textDecoration: 'none', borderRadius: T.radiusSm, transition: 'color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.title)}
              onMouseLeave={e => (e.currentTarget.style.color = T.titleSub as string)}>
              Login
            </Link>
            <Link to="/auth" className="hidden sm:flex" style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 600, color: T.white,
              background: T.accent, borderRadius: T.radiusSm, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity .3s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Open Account <ArrowRight size={14} />
            </Link>
            <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden"
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: T.radiusSm, border: 'none', background: mobileNav ? T.bgLight : 'transparent', cursor: 'pointer', transition: 'background .3s' }}>
              {mobileNav ? <X size={22} color={T.title} /> : <Menu size={22} color={T.title} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileNav && (
          <div className="md:hidden" style={{ background: T.bgLight, borderTop: `1px solid ${T.border}` }}>
            <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileNav(false)}
                  style={{ padding: '14px 20px', fontSize: 15, fontWeight: 500, color: T.titleSub, textDecoration: 'none', borderBottom: `1px solid ${T.border}`, transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.titleSub)}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 10, borderTop: `1px solid ${T.border}` }}>
              <Link to="/auth" onClick={() => setMobileNav(false)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, color: T.titleSub, background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, textDecoration: 'none', textAlign: 'center' }}>
                Login
              </Link>
              <Link to="/auth" onClick={() => setMobileNav(false)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, color: T.white, background: T.accent, borderRadius: T.radiusSm, textDecoration: 'none', textAlign: 'center' }}>
                Open Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile nav backdrop */}
      {mobileNav && (
        <div className="md:hidden" onClick={() => setMobileNav(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)' }} />
      )}

      {/* ══════════ HERO ══════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 64, position: 'relative',
        background: `linear-gradient(170deg, ${T.bg} 0%, ${T.bgLight} 100%)`,
      }}>
        {/* Subtle background logo */}
        <img src="/herostock-logo.jpeg" alt="" style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60vmin', maxWidth: 600, height: 'auto',
          objectFit: 'contain', opacity: 0.04, zIndex: 0, pointerEvents: 'none',
        }} />

        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto', padding: '48px 0', position: 'relative', zIndex: 2 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: T.accentDim, border: `1px solid rgba(5,160,3,0.20)`, marginBottom: 32 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>Live on Dhaka Stock Exchange</span>
              </div>

              {/* Headline */}
              <h1 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', color: T.title, margin: 0 }}>
                Invest in<br />
                <span style={{ color: T.accent }}>Bangladesh's</span><br />
                future.
              </h1>

              {/* Subtext */}
              <p style={{ marginTop: 20, color: T.text, lineHeight: 1.75, maxWidth: 480 }} className="text-sm sm:text-base lg:text-[17px]">
                Bangladesh's most trusted platform for trading on the Dhaka Stock Exchange.
                BSEC regulated. Zero account fees. Learn before you invest.
              </p>

              {/* CTAs */}
              <div style={{ marginTop: 28 }} className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Link to="/auth" style={{
                  padding: '14px 30px', fontSize: 15, fontWeight: 700, color: T.white,
                  background: T.accent, borderRadius: 12, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity .3s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Open Free Account <ArrowRight size={16} />
                </Link>
                <a href="#market" style={{
                  padding: '14px 30px', fontSize: 15, fontWeight: 600, color: T.titleSub,
                  background: 'rgba(0,0,0,0.03)', border: `1px solid ${T.border}`,
                  borderRadius: 12, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'border-color .3s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                  <BarChart3 size={16} /> Live Market
                </a>
              </div>

              {/* Trust badges */}
              <div style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                {TRUST.map(t => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color={T.accent} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.titleSub }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image + Market widget */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              {/* Hero image */}
              <img src="/herostock-logo.jpeg" alt="HeroStock.AI — Fintech Bangladesh"
                className="w-48 sm:w-64 lg:w-72"
                style={{ height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.12))', borderRadius: T.radius }} />

              {/* Market card */}
              <div style={{ width: '100%' }}>
                <div style={{
                  background: T.bgCard,
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: 20, padding: 24,
                  border: `1px solid ${T.border}`,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
                }}>
                  {/* Card header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.titleSub }}>DSE Live Indices</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: T.accent }}>
                      <Activity size={12} /> <span>Live</span>
                    </div>
                  </div>

                  {market ? (
                    <>
                      {/* Indices */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {[dsex, dses, ds30].filter(Boolean).map(idx => (
                          <div key={idx!.index_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.title }}>{idx!.index_name}</div>
                              <div style={{ fontSize: 10, color: T.titleSub, marginTop: 1 }}>Dhaka Stock Exchange</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: T.fontMono, color: T.title }}>
                                {idx!.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: T.fontMono, color: idx!.change_pct >= 0 ? T.accent : '#dc2626', marginTop: 1 }}>
                                {idx!.change_pct >= 0 ? '+' : ''}{idx!.change_pct.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Advancers / Decliners */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ padding: '12px 8px', borderRadius: 12, background: T.accentDim, textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: T.accent, fontFamily: T.fontMono }}>{market.stats.advancers}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Advancers</div>
                        </div>
                        <div style={{ padding: '12px 8px', borderRadius: 12, background: 'rgba(220,38,38,0.08)', textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', fontFamily: T.fontMono }}>{market.stats.decliners}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Decliners</div>
                        </div>
                      </div>

                      {/* Total volume */}
                      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: T.titleSub, fontWeight: 500 }}>Total Volume</span>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: T.fontMono, color: T.title }}>{formatVolume(market.stats.totalVolume)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ height: 52, borderRadius: 12, background: 'rgba(0,0,0,0.03)', animation: 'pulse 2s infinite' }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <div style={{ background: T.bgLight, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: '95%', maxWidth: 1000, margin: '0 auto', padding: '40px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, textAlign: 'center' }} className="sm:!grid-cols-4 sm:!gap-24">
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: T.title, fontFamily: T.fontMono, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.titleSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bg }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>Transparent Pricing</div>
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Free and transparent pricing</h2>
            <p style={{ fontSize: 16, color: T.titleSub, maxWidth: 480, margin: '0 auto' }}>No hidden charges. No surprises. Ever.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 960, margin: '0 auto' }} className="sm:!grid-cols-4 sm:!gap-20">
            {PRICING.map((p, i) => (
              <div key={p.label} style={{
                border: i === 0 ? `1.5px solid rgba(5,160,3,0.25)` : `1px solid ${T.border}`,
                borderRadius: 20, padding: '28px 16px', textAlign: 'center',
                background: i === 0 ? T.accentDim : 'rgba(255,255,255,0.02)',
                transition: 'transform .3s, border-color .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = i === 0 ? 'rgba(5,160,3,0.25)' : T.border; }}>
                <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 700, color: T.accent, fontFamily: T.fontMono, letterSpacing: '-0.03em' }}>{p.value}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.title, marginTop: 12 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: T.titleSub, marginTop: 4 }}>{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ LIVE MARKET ══════════ */}
      <section id="market" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bgLight }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 10 }}>Live Data</div>
              <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: T.title, margin: 0 }}>Today's Market</h2>
              <p style={{ color: T.titleSub, fontSize: 14, marginTop: 6 }}>Dhaka Stock Exchange — updates every 30s</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: T.accent, background: T.accentDim, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(5,160,3,0.20)' }}>
              <Activity size={12} /> <span>Live</span>
            </div>
          </div>

          {market ? (
            <>
              {/* Index cards */}
              <div style={{ display: 'grid', gap: 16, marginBottom: 20 }} className="grid-cols-1 sm:grid-cols-3 sm:gap-20">
                {[dsex, dses, ds30].filter(Boolean).map((idx, i) => {
                  const colors = [T.blue, T.accent, '#a855f7'];
                  return (
                    <div key={idx!.index_name} style={{
                      background: T.bgCard, backdropFilter: 'blur(12px)',
                      borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}`,
                      transition: 'border-color .3s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.titleSub }}>{idx!.index_name}</div>
                          <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 700, fontFamily: T.fontMono, color: T.title, marginTop: 8 }}>
                            {idx!.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div style={{ width: 42, height: 42, borderRadius: T.radiusSm, background: `${colors[i]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingUp size={18} color={colors[i]} />
                        </div>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, fontFamily: T.fontMono, color: idx!.change_pct >= 0 ? T.accent : '#dc2626' }}>
                        {idx!.change_pct >= 0 ? '+' : ''}{idx!.change_pct.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Market stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="sm:!grid-cols-4 sm:!gap-16">
                {[
                  { label: 'Total Volume', value: formatVolume(market.stats.totalVolume), Icon: BarChart3, accent: T.blue },
                  { label: 'Total Trades', value: formatNumber(market.stats.totalTrades), Icon: Activity, accent: '#f59e0b' },
                  { label: 'Advancers', value: String(market.stats.advancers), Icon: ArrowUpCircle, accent: T.accent },
                  { label: 'Decliners', value: String(market.stats.decliners), Icon: ArrowDownCircle, accent: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: T.bgCard, backdropFilter: 'blur(12px)',
                    borderRadius: 14, padding: '18px', textAlign: 'center',
                    border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <s.Icon size={16} color={s.accent} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: T.title }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.titleSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-3 sm:gap-20">
              {[1, 2, 3].map(i => <div key={i} style={{ height: 120, borderRadius: T.radius, background: 'rgba(0,0,0,0.03)', animation: 'pulse 2s infinite' }} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ GLOBAL EXCHANGE COMPARISON ══════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bg }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>Global Markets</div>
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Stock Exchange Comparison</h2>
            <p style={{ fontSize: 16, color: T.titleSub, maxWidth: 520, margin: '0 auto' }}>How the world's top exchanges stack up — NASDAQ, DSE, PSX, BSE &amp; CSE.</p>
          </div>
          <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, overflow: 'hidden', background: T.bgCard, backdropFilter: 'blur(12px)' }}>
            <GlobalExchangeComparison variant="dark" />
          </div>
        </div>
      </section>

      {/* ══════════ WHY HERO ══════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bg }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>Why Hero</div>
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, margin: '0 0 14px' }}>No gimmicks. Just investments.</h2>
            <p style={{ fontSize: 16, color: T.titleSub, maxWidth: 440, margin: '0 auto' }}>Built for Bangladeshi investors who want a simple, trusted platform.</p>
          </div>
          <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-20">
            {WHY.map(w => (
              <div key={w.title} style={{
                padding: '28px 24px', borderRadius: 18,
                border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.01)',
                transition: 'border-color .3s, transform .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(5,160,3,0.20)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <w.icon size={20} color={T.accent} />
                </div>
                <h3 style={{ fontFamily: T.fontTitle, fontSize: 16, fontWeight: 700, color: T.title, margin: '0 0 8px' }}>{w.title}</h3>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.65, margin: 0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bgLight }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>Platform Features</div>
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, margin: '0 0 14px' }}>Everything you need to invest</h2>
            <p style={{ fontSize: 16, color: T.titleSub, maxWidth: 480, margin: '0 auto' }}>A complete platform built for Bangladeshi investors trading on the DSE.</p>
          </div>
          <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: T.bgCard, backdropFilter: 'blur(12px)',
                borderRadius: 18, padding: '28px',
                border: `1px solid ${T.border}`,
                transition: 'border-color .3s, transform .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <f.icon size={20} color={T.accent} />
                </div>
                <h3 style={{ fontFamily: T.fontTitle, fontSize: 16, fontWeight: 700, color: T.title, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ACADEMY BANNER ══════════ */}
      <section id="learn" style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bg }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{
            borderRadius: 24, padding: 'clamp(32px, 5vw, 56px)',
            background: 'linear-gradient(135deg, rgba(5,160,3,0.06) 0%, rgba(37,99,235,0.06) 100%)',
            border: `1px solid rgba(5,160,3,0.15)`,
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 28,
          }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <GraduationCap size={18} color={T.accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hero Academy</span>
              </div>
              <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: T.title, margin: '0 0 12px' }}>Learn before you invest.</h2>
              <p style={{ fontSize: 15, color: T.text, lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
                Free courses on DSE trading, portfolio management, risk assessment, and
                stock market fundamentals. Complete the academy to unlock live trading.
              </p>
            </div>
            <Link to="/auth" style={{
              padding: '14px 28px', background: T.accent, color: T.white,
              fontWeight: 700, fontSize: 15, borderRadius: 12, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              transition: 'opacity .3s', flexShrink: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Start Learning <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 0', background: T.bgLight, textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px' }}>
          <h2 style={{ fontFamily: T.fontTitle, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: T.title, margin: '0 0 14px' }}>Ready to start investing?</h2>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.65, margin: '0 0 36px' }}>
            Join thousands of investors on Hero. Open your free account in minutes. No paperwork. No hidden fees.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            <Link to="/auth" style={{
              padding: '14px 32px', fontSize: 15, fontWeight: 700, color: T.white,
              background: T.accent, borderRadius: 12, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity .3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Open Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/auth" style={{
              padding: '14px 28px', fontSize: 15, fontWeight: 600, color: T.titleSub,
              background: 'rgba(0,0,0,0.03)', border: `1px solid ${T.border}`,
              borderRadius: 12, textDecoration: 'none', transition: 'border-color .3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: T.bg, padding: '56px 0 32px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ width: '95%', maxWidth: 1320, margin: '0 auto' }}>
          {/* Logo + tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" style={{ width: 40, height: 40, borderRadius: T.radiusSm, objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: T.fontTitle, fontWeight: 700, fontSize: 15, color: T.title }}>HeroStock.AI</div>
              <div style={{ fontSize: 10, color: T.titleSub }}>Fintech Bangladesh</div>
            </div>
          </div>

          {/* Footer links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '28px 20px', marginBottom: 40 }} className="sm:!grid-cols-4 sm:!gap-x-24">
            {[
              { title: 'Account', links: [{ label: 'Open Account', href: '/auth' }, { label: 'Login', href: '/auth' }, { label: 'KYC Status', href: '/kyc' }] },
              { title: 'Platform', links: [{ label: 'Live Market', href: '#market' }, { label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }] },
              { title: 'Learn', links: [{ label: 'Hero Academy', href: '#learn' }, { label: 'DSE Basics', href: '#' }, { label: 'Investment Guide', href: '#' }] },
              { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Careers', href: '#' }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.titleSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{col.title}</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link to={l.href} style={{ fontSize: 14, color: T.text, textDecoration: 'none', transition: 'color .3s' }}
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

          {/* Regulatory */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 16 }}>
              {TRUST.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={12} color={T.accent} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.titleSub }}>{t.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.text, lineHeight: 1.7, maxWidth: 720, margin: 0 }}>
              Hero Investment Platform is regulated by the Bangladesh Securities and Exchange Commission (BSEC).
              DSE Member | CSE Member | CDBL Depository Participant. Investments in securities markets are subject
              to market risks. Read all related documents carefully before investing. Past performance is not indicative of future returns.
            </p>
            <p style={{ fontSize: 11, color: T.titleSub, marginTop: 12 }}>
              &copy; {new Date().getFullYear()} Hero Investment Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
