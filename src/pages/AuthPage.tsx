import { useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageCircle, Phone, Mail, ArrowLeft, Loader2 } from 'lucide-react';

const WHATSAPP_NUMBER = '8801324686540';
const WHATSAPP_MESSAGE = encodeURIComponent('Hi, I want to open an Abaci Investments account.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

type AuthMode = 'main' | 'email-login' | 'email-register' | 'phone' | 'otp';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const { signIn, signUp, signInWithPhone, verifyPhoneOtp, isAuthenticated, isGuest } = useAuth();

  if (isAuthenticated && !isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  function formatPhone(val: string): string {
    const digits = val.replace(/\D/g, '');
    if (digits.startsWith('880')) return '+' + digits;
    if (digits.startsWith('0')) return '+88' + digits;
    if (digits.startsWith('1') && digits.length <= 11) return '+880' + digits;
    return val.startsWith('+') ? val : '+' + digits;
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'email-login') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      } else {
        if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
        const result = await signUp(email, password, fullName, phone);
        if (result.error) setError(result.error);
      }
    } finally { setLoading(false); }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const formatted = formatPhone(phone);
    if (formatted.length < 14) { setError('Enter a valid Bangladesh phone number'); return; }
    setLoading(true);
    setPhone(formatted);
    const result = await signInWithPhone(formatted);
    setLoading(false);
    if (result.error) { setError(result.error); }
    else { setMode('otp'); setTimeout(() => otpRef.current?.focus(), 100); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    const result = await verifyPhoneOtp(phone, otp, fullName || undefined);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  const isSubFlow = mode !== 'main';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Left side — branding */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '55%',
        background: '#f8f8f8',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }} className="hidden md:flex">
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#00b386', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 20px 40px rgba(0,179,134,0.25)' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 44 }}>A</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#121212', textAlign: 'center', lineHeight: 1.3, margin: 0 }}>
          Invest in Bangladesh's<br />
          <span style={{ color: '#00b386' }}>Capital Markets</span>
        </h2>
        <p style={{ fontSize: 15, color: '#7c7e8c', textAlign: 'center', marginTop: 12, maxWidth: 360, lineHeight: 1.6 }}>
          Trade on the Dhaka Stock Exchange. BSEC regulated. Zero account fees.
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
          {['BSEC Regulated', 'DSE Member', 'CDBL Participant'].map(badge => (
            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00b386' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#7c7e8c' }}>{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side — Auth */}
      <div style={{
        marginLeft: 'auto', width: '100%', maxWidth: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', background: 'transparent',
      }} className="sm:!p-[40px_24px] md:w-[45%] md:min-w-[45%] md:!bg-white">

        <div className="md:hidden" style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: '#ffffff',
        }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 2 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Link to="/dashboard">
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#00b386', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,179,134,0.2)' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>A</span>
              </div>
            </Link>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>
              {mode === 'otp' ? 'Verify your number' : mode === 'phone' ? 'Sign up with phone' : mode === 'email-login' ? 'Welcome back' : mode === 'email-register' ? 'Create with email' : 'Get Started'}
            </h1>
            <p style={{ fontSize: 14, color: '#7c7e8c', marginTop: 6 }}>
              {mode === 'otp' ? `Code sent to ${phone}` : mode === 'phone' ? "We'll send you a verification code" : mode === 'main' ? 'Create an account or sign in' : mode === 'email-login' ? 'Sign in with your email' : 'Create an account with email'}
            </p>
          </div>

          {/* Guest notice */}
          {isGuest && mode === 'main' && (
            <div style={{
              background: 'rgba(0,179,134,0.06)', border: '1px solid rgba(0,179,134,0.2)', borderRadius: 12,
              padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#009973', lineHeight: 1.5,
            }}>
              You're currently using Abaci as a guest. Create an account to save your trading history and progress permanently.
            </div>
          )}

          {/* Card */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px 24px',
            border: '1px solid #e9e9eb', boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}>

            {/* Main — WhatsApp first */}
            {mode === 'main' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* WhatsApp — primary */}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '14px 16px', borderRadius: 99,
                    background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 16,
                    textDecoration: 'none', transition: 'opacity 0.15s', border: 'none', cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  <MessageCircle size={22} />
                  Continue with WhatsApp
                </a>

                <p style={{ fontSize: 11, color: '#a1a3ad', textAlign: 'center', margin: '2px 0', lineHeight: 1.4 }}>
                  Message us on WhatsApp — we'll set up your account and help you get started.
                </p>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#e9e9eb' }} />
                  <span style={{ fontSize: 11, color: '#c7c8ce', fontWeight: 500 }}>other options</span>
                  <div style={{ flex: 1, height: 1, background: '#e9e9eb' }} />
                </div>

                {/* Phone OTP */}
                <button onClick={() => { setMode('phone'); setError(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '12px 16px', borderRadius: 99,
                    background: '#f8f8f8', color: '#44475b', fontWeight: 600, fontSize: 14,
                    border: '1px solid #e9e9eb', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f8f8f8')}>
                  <Phone size={17} />
                  Sign up with Phone Number
                </button>

                {/* Email login */}
                <button onClick={() => { setMode('email-login'); setError(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '12px 16px', borderRadius: 99,
                    background: '#f8f8f8', color: '#44475b', fontWeight: 600, fontSize: 14,
                    border: '1px solid #e9e9eb', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f8f8f8')}>
                  <Mail size={17} />
                  Sign in with Email
                </button>
              </div>
            )}

            {/* Phone input */}
            {mode === 'phone' && (
              <>
                <button type="button" onClick={() => { setMode('main'); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#a1a3ad', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name (optional)" />
                  <Input label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXX XXXXXX" required autoFocus />
                  {error && <div style={{ fontSize: 13, color: '#eb5b3c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
                  <Button type="submit" loading={loading} className="w-full" size="lg">Send Verification Code</Button>
                </form>
              </>
            )}

            {/* OTP verify */}
            {mode === 'otp' && (
              <>
                <button type="button" onClick={() => { setMode('phone'); setError(''); setOtp(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#a1a3ad', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
                  <ArrowLeft size={14} /> Change number
                </button>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#44475b', marginBottom: 6 }}>Verification Code</label>
                    <input ref={otpRef} type="text" inputMode="numeric" maxLength={6}
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      style={{
                        width: '100%', padding: '14px 16px', background: '#f8f8f8', border: '1px solid #e9e9eb',
                        borderRadius: 12, textAlign: 'center', fontSize: 24, fontFamily: 'monospace',
                        letterSpacing: '0.3em', outline: 'none',
                      }} />
                  </div>
                  {error && <div style={{ fontSize: 13, color: '#eb5b3c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
                  <button type="submit" disabled={loading || otp.length < 6}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: '#00b386', color: '#fff',
                      fontWeight: 600, fontSize: 15, opacity: loading || otp.length < 6 ? 0.5 : 1,
                    }}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify & Create Account'}
                  </button>
                  <button type="button" onClick={() => { setError(''); handleSendOtp(new Event('click') as any); }}
                    style={{ width: '100%', textAlign: 'center', fontSize: 13, color: '#a1a3ad', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    Resend code
                  </button>
                </form>
              </>
            )}

            {/* Email login */}
            {mode === 'email-login' && (
              <>
                <button type="button" onClick={() => { setMode('main'); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#a1a3ad', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
                  <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} />
                  {error && <div style={{ fontSize: 13, color: '#eb5b3c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
                  <Button type="submit" loading={loading} className="w-full" size="lg">Sign In</Button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" onClick={() => { setMode('email-register'); setError(''); }}
                    style={{ fontSize: 14, fontWeight: 500, color: '#5367ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Don't have an account? Sign up with email
                  </button>
                </div>
              </>
            )}

            {/* Email register */}
            {mode === 'email-register' && (
              <>
                <button type="button" onClick={() => { setMode('main'); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#a1a3ad', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" required />
                  <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1XXX XXXXXX" />
                  <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                  <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} />
                  {error && <div style={{ fontSize: 13, color: '#eb5b3c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
                  <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" onClick={() => { setMode('email-login'); setError(''); }}
                    style={{ fontSize: 14, fontWeight: 500, color: '#5367ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Already have an account? Sign in
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Skip */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/dashboard" style={{ fontSize: 14, fontWeight: 500, color: '#7c7e8c', textDecoration: 'none' }}>
              Skip — continue as guest
            </Link>
          </div>

          <p style={{ fontSize: 11, color: '#a1a3ad', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            Abaci Investments is regulated by BSEC.
          </p>
        </div>
      </div>
    </div>
  );
}
