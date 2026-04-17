import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, isAuthenticated, isGuest } = useAuth();

  // If user is already logged in with a real account, send to dashboard
  if (isAuthenticated && !isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      } else {
        if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
        const result = await signUp(email, password, fullName, phone);
        if (result.error) setError(result.error);
      }
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Left side — branding */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '55%',
        background: 'linear-gradient(135deg, #f8f9fb 0%, #eef1f6 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }} className="hidden md:flex">
        <img
          src="/abaci-logo.jpeg"
          alt="Abaci Investments"
          style={{
            width: '420px', height: 'auto', objectFit: 'contain',
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
            marginBottom: 32,
          }}
        />
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', textAlign: 'center', lineHeight: 1.3, margin: 0 }}>
          Invest in Bangladesh's<br />
          <span style={{ color: '#60a5fa' }}>Future</span>
        </h2>
        <p style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 12, maxWidth: 360, lineHeight: 1.6 }}>
          Trade on the Dhaka Stock Exchange. BSEC regulated. Zero account fees.
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
          {['BSEC Regulated', 'DSE Member', 'CDBL Participant'].map(badge => (
            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side — Auth form */}
      <div style={{
        marginLeft: 'auto', width: '100%', maxWidth: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        background: 'transparent',
      }} className="sm:!p-[40px_24px] md:w-[45%] md:min-w-[45%] md:!bg-white">

        <div className="md:hidden" style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
        }}>
          <img src="/abaci-logo.jpeg" alt="" style={{
            position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
            width: '180px', opacity: 0.15, objectFit: 'contain',
          }} />
        </div>

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 2 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Link to="/dashboard">
              <img
                src="/abaci-logo.jpeg"
                alt="Abaci Investments"
                style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', margin: '0 auto 16px', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              />
            </Link>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
              {mode === 'login' ? 'Sign in to save your progress' : 'Create an account to keep your data'}
            </p>
          </div>

          {/* Guest notice */}
          {isGuest && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
              padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#15803d', lineHeight: 1.5,
            }}>
              You're currently using Abaci as a guest. Create an account to save your trading history and progress permanently.
            </div>
          )}

          {/* Form card */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" required />
                  <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1XXX XXXXXX" />
                </>
              )}
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} />

              {error && (
                <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10 }}>{error}</div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                style={{ fontSize: 14, fontWeight: 500, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>

          {/* Skip link */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/dashboard" style={{ fontSize: 14, fontWeight: 500, color: '#64748b', textDecoration: 'none' }}>
              Skip — continue as guest
            </Link>
          </div>

          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            Abaci Investments is regulated by BSEC.
          </p>
        </div>
      </div>
    </div>
  );
}
