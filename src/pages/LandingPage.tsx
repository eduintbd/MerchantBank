import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { formatNumber, formatVolume, cn } from '@/lib/utils';
import {
  TrendingUp, Briefcase, GraduationCap, ShieldCheck, Users, BarChart3,
  ArrowRight, Activity, ArrowUpCircle, ArrowDownCircle, CheckCircle2,
  ChevronRight, BookOpen, Zap, Lock, Menu, X,
} from 'lucide-react';

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
  { icon: BarChart3, title: 'Real-time DSE Data', desc: 'Live DSEX, DSES, DS30 indices and stock prices updated every 30 seconds.', accent: '#2563eb', bg: '#eff6ff' },
  { icon: TrendingUp, title: 'Stock Trading', desc: 'Buy and sell DSE-listed stocks with a simple, intuitive trading interface.', accent: '#16a34a', bg: '#f0fdf4' },
  { icon: Briefcase, title: 'Portfolio Tracking', desc: 'Monitor your investments with real-time P/L calculations and charts.', accent: '#7c3aed', bg: '#faf5ff' },
  { icon: GraduationCap, title: 'Hero Academy', desc: 'Free courses on DSE fundamentals. Learn before you invest.', accent: '#d97706', bg: '#fffbeb' },
  { icon: ShieldCheck, title: 'KYC & Compliance', desc: 'BSEC-compliant identity verification. Your data is always protected.', accent: '#dc2626', bg: '#fff5f5' },
  { icon: Users, title: 'Referral Program', desc: 'Earn commissions by referring friends. Track earnings in real-time.', accent: '#0891b2', bg: '#ecfeff' },
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
  const ds30  = market?.indices.find(i => i.index_name === 'DS30');

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#1e293b', background: '#fff', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="sm:!h-16 sm:!px-6">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-8 h-8 sm:w-10 sm:h-10" style={{ borderRadius: 10, objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }} className="text-sm sm:text-base">HeroStock.AI</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1 }} className="hidden sm:block">Fintech Bangladesh</div>
            </div>
          </div>

          {/* Nav links — desktop */}
          <nav style={{ display: 'flex', gap: 32 }} className="hidden md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: '#64748b', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTAs + Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/auth" className="hidden sm:block" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none', borderRadius: 8, transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Login
            </Link>
            <Link to="/auth" className="hidden sm:flex" style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'opacity .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Open Account <ArrowRight size={14} />
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="md:hidden"
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: mobileNav ? '#f1f5f9' : 'transparent', cursor: 'pointer', transition: 'background .15s' }}
            >
              {mobileNav ? <X size={22} color="#0f172a" /> : <Menu size={22} color="#0f172a" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileNav && (
          <div
            className="md:hidden"
            style={{
              background: '#fff',
              borderTop: '1px solid #f1f5f9',
              boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
              animation: 'slideDown .2s ease-out',
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
              {NAV_LINKS.map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileNav(false)}
                  style={{ padding: '14px 20px', fontSize: 15, fontWeight: 500, color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f8fafc', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 10, borderTop: '1px solid #f1f5f9' }}>
              <Link to="/auth" onClick={() => setMobileNav(false)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#475569', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, textDecoration: 'none', textAlign: 'center' }}>
                Login
              </Link>
              <Link to="/auth" onClick={() => setMobileNav(false)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 10, textDecoration: 'none', textAlign: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                Open Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile nav backdrop */}
      {mobileNav && (
        <div
          className="md:hidden"
          onClick={() => setMobileNav(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.2)' }}
        />
      )}

      {/* ══════════════════════════════════════
          HERO — full viewport
      ══════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 56, position: 'relative',
        background: '#f8fafc',
      }}>
        {/* Full-page background image — centered, large, visible */}
        <img
          src="/herostock-logo.jpeg"
          alt=""
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70vmin', maxWidth: 700, height: 'auto',
            objectFit: 'contain', opacity: 0.18, zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 16px', width: '100%', position: 'relative', zIndex: 2 }} className="sm:!p-[48px_24px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 28 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>Live on Dhaka Stock Exchange</span>
              </div>

              {/* Headline */}
              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', color: '#0f172a', margin: 0 }}>
                Invest in<br />
                <span style={{ color: '#2563eb' }}>Bangladesh's</span><br />
                future.
              </h1>

              {/* Subtext */}
              <p style={{ marginTop: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 480 }} className="text-sm sm:text-base lg:text-[17px]">
                Bangladesh's most trusted platform for trading on the Dhaka Stock Exchange.
                BSEC regulated. Zero account fees. Learn before you invest.
              </p>

              {/* CTAs */}
              <div style={{ marginTop: 24 }} className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Link to="/auth" style={{ padding: '13px 28px', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
                  Open Free Account <ArrowRight size={16} />
                </Link>
                <a href="#market" style={{ padding: '13px 28px', fontSize: 15, fontWeight: 600, color: '#334155', background: 'rgba(248,250,252,0.9)', border: '1.5px solid #e2e8f0', borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <BarChart3 size={16} /> Live Market
                </a>
              </div>

              {/* Trust badges */}
              <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                {TRUST.map(t => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#16a34a" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image + Market widget */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Visible hero image */}
              <img
                src="/herostock-logo.jpeg"
                alt="HeroStock.AI — Fintech Bangladesh"
                className="w-48 sm:w-64 lg:w-80"
                style={{
                  height: 'auto', objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.15))',
                  borderRadius: 16,
                }}
              />

              {/* Market card below image */}
              <div style={{ position: 'relative', width: '100%' }}>
              {/* Card */}
              <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)', backdropFilter: 'blur(8px)', border: '1px solid rgba(226,232,240,0.6)' }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>DSE Live Indices</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#16a34a' }}>
                    <Activity size={12} />
                    <span>Live</span>
                  </div>
                </div>

                {market ? (
                  <>
                    {/* Indices */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {[dsex, dses, ds30].filter(Boolean).map(idx => (
                        <div key={idx!.index_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: '#f8fafc' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{idx!.index_name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Dhaka Stock Exchange</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#0f172a' }}>
                              {idx!.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: idx!.change_pct >= 0 ? '#16a34a' : '#dc2626', marginTop: 1 }}>
                              {idx!.change_pct >= 0 ? '+' : ''}{idx!.change_pct.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Advancers / Decliners */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ padding: '12px 8px', borderRadius: 12, background: '#f0fdf4', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d', fontFamily: "'JetBrains Mono', monospace" }}>{market.stats.advancers}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Advancers</div>
                      </div>
                      <div style={{ padding: '12px 8px', borderRadius: 12, background: '#fff5f5', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#b91c1c', fontFamily: "'JetBrains Mono', monospace" }}>{market.stats.decliners}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Decliners</div>
                      </div>
                    </div>

                    {/* Total trades */}
                    <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Total Volume</span>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#0f172a' }}>{formatVolume(market.stats.totalVolume)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="skeleton" style={{ height: 52, borderRadius: 12 }} />
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════ */}
      <div style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, textAlign: 'center' }} className="sm:!grid-cols-4 sm:!gap-24 sm:!px-6">
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          PRICING
      ══════════════════════════════════════ */}
      <section id="pricing" style={{ padding: 'clamp(48px, 8vw, 80px) 16px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 12 }}>Transparent Pricing</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 14px' }}>Free and transparent pricing</h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>No hidden charges. No surprises. Ever.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 900, margin: '0 auto' }} className="sm:!grid-cols-4 sm:!gap-16">
            {PRICING.map((p, i) => (
              <div key={p.label} style={{
                border: i === 0 ? '2px solid #bfdbfe' : '1.5px solid #f1f5f9',
                borderRadius: 20,
                padding: '24px 16px',
                textAlign: 'center',
                background: i === 0 ? '#eff6ff' : '#fff',
                transition: 'box-shadow .2s, transform .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: '#2563eb', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>{p.value}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 10 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          LIVE MARKET
      ══════════════════════════════════════ */}
      <section id="market" style={{ padding: 'clamp(48px, 8vw, 80px) 16px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>Live Data</div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Today's Market</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Dhaka Stock Exchange — updates every 30s</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '6px 12px', borderRadius: 999, border: '1px solid #bbf7d0' }}>
              <Activity size={12} />
              <span>Live</span>
            </div>
          </div>

          {market ? (
            <>
              {/* Index cards */}
              <div style={{ display: 'grid', gap: 12, marginBottom: 16 }} className="grid-cols-1 sm:grid-cols-3 sm:gap-16">
                {[dsex, dses, ds30].filter(Boolean).map((idx, i) => {
                  const colors = ['#2563eb', '#16a34a', '#7c3aed'];
                  const bgs    = ['#eff6ff', '#f0fdf4', '#faf5ff'];
                  return (
                    <div key={idx!.index_name} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>{idx!.index_name}</div>
                          <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#0f172a', marginTop: 6, letterSpacing: '-0.02em' }}>
                            {idx!.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: bgs[i], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingUp size={18} color={colors[i]} />
                        </div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: idx!.change_pct >= 0 ? '#16a34a' : '#dc2626' }}>
                        {idx!.change_pct >= 0 ? '▲' : '▼'} {Math.abs(idx!.change_pct).toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Market stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="sm:!grid-cols-4 sm:!gap-12">
                {[
                  { label: 'Total Volume', value: formatVolume(market.stats.totalVolume), Icon: BarChart3, accent: '#2563eb', bg: '#eff6ff' },
                  { label: 'Total Trades', value: formatNumber(market.stats.totalTrades), Icon: Activity, accent: '#d97706', bg: '#fffbeb' },
                  { label: 'Advancers', value: String(market.stats.advancers), Icon: ArrowUpCircle, accent: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Decliners', value: String(market.stats.decliners), Icon: ArrowDownCircle, accent: '#dc2626', bg: '#fff5f5' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <s.Icon size={16} color={s.accent} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#0f172a' }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gap: 12 }} className="grid-cols-1 sm:grid-cols-3 sm:gap-16">
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHY HERO (4 pillars)
      ══════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 16px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 12 }}>Why Hero</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 14px' }}>No gimmicks. Just investments.</h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>Built for Bangladeshi investors who want a simple, trusted platform.</p>
          </div>
          <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-20">
            {WHY.map(w => (
              <div key={w.title} style={{ padding: '28px 24px', borderRadius: 18, border: '1.5px solid #f1f5f9', background: '#fff', transition: 'box-shadow .2s, border-color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.08)'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f1f5f9'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <w.icon size={20} color="#2563eb" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{w.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" style={{ padding: 'clamp(48px, 8vw, 80px) 16px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 12 }}>Platform Features</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 14px' }}>Everything you need to invest</h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>A complete platform built for Bangladeshi investors trading on the DSE.</p>
          </div>
          <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 18, padding: '24px', border: '1.5px solid #f1f5f9', transition: 'box-shadow .2s, transform .2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <f.icon size={20} color={f.accent} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ACADEMY BANNER
      ══════════════════════════════════════ */}
      <section id="learn" style={{ padding: 'clamp(48px, 8vw, 80px) 16px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ borderRadius: 24, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)', padding: 'clamp(32px, 5vw, 56px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 28 }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <GraduationCap size={18} color="rgba(255,255,255,0.75)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hero Academy</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Learn before you invest.</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
                Free courses on DSE trading, portfolio management, risk assessment, and
                stock market fundamentals. Complete the academy to unlock live trading.
              </p>
            </div>
            <Link to="/auth" style={{ padding: '14px 28px', background: '#fff', color: '#1d4ed8', fontWeight: 700, fontSize: 15, borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', flexShrink: 0 }}>
              Start Learning <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 16px', background: '#f8fafc', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Ready to start investing?</h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.65, margin: '0 0 32px' }}>
            Join thousands of investors on Hero. Open your free account in minutes. No paperwork. No hidden fees.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            <Link to="/auth" style={{ padding: '13px 32px', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
              Open Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/auth" style={{ padding: '13px 28px', fontSize: 15, fontWeight: 600, color: '#475569', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, textDecoration: 'none' }}>
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ background: '#0f172a', padding: '56px 24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Logo + tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>HeroStock.AI</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Fintech Bangladesh</div>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{col.title}</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link to={l.href} style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', transition: 'color .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Regulatory */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 16 }}>
              {TRUST.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={12} color="#16a34a" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{t.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.7, maxWidth: 720, margin: 0 }}>
              Hero Investment Platform is regulated by the Bangladesh Securities and Exchange Commission (BSEC).
              DSE Member | CSE Member | CDBL Depository Participant. Investments in securities markets are subject
              to market risks. Read all related documents carefully before investing. Past performance is not indicative of future returns.
            </p>
            <p style={{ fontSize: 11, color: '#334155', marginTop: 12 }}>
              &copy; {new Date().getFullYear()} Hero Investment Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
