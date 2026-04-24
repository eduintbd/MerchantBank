import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X, MessageCircle, Phone, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { shouldShowLeadCapture, getExistingLead, saveLead } from '@/services/visitorTracker';

const WHATSAPP_NUMBER = '8801324686530';
const WHATSAPP_MESSAGE = encodeURIComponent('Hi, I want to open an Abaci Investments account.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

type Step = 'prompt' | 'phone' | 'otp' | 'name' | 'done';

export function LeadCaptureModal() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<Step>('prompt');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { signInWithPhone, verifyPhoneOtp, updateProfile, isGuest } = useAuth();

  const isExcluded = location.pathname === '/dashboard' || location.pathname === '/';

  useEffect(() => {
    if (isExcluded || !isGuest) return;
    const timer = setTimeout(() => {
      if (shouldShowLeadCapture() && !dismissed) setShow(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [dismissed, isExcluded, isGuest]);

  useEffect(() => {
    if (dismissed || isExcluded || !isGuest || getExistingLead()) return;
    const interval = setInterval(() => {
      if (shouldShowLeadCapture()) {
        setShow(true);
        clearInterval(interval);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [dismissed, isExcluded, isGuest]);

  useEffect(() => {
    if (isExcluded && show) setShow(false);
  }, [isExcluded, show]);

  // Auto-focus OTP input
  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  function handleDismiss() {
    setDismissed(true);
    setShow(false);
  }

  function handleWhatsApp() {
    saveLead({ phone: 'whatsapp' }, 'whatsapp_cta');
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
  }

  function formatPhone(val: string): string {
    const digits = val.replace(/\D/g, '');
    if (digits.startsWith('880')) return '+' + digits;
    if (digits.startsWith('0')) return '+88' + digits;
    if (digits.startsWith('1') && digits.length <= 11) return '+880' + digits;
    return val.startsWith('+') ? val : '+' + digits;
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const formatted = formatPhone(phone);
    if (formatted.length < 14) {
      setError('Enter a valid Bangladesh phone number');
      return;
    }
    setLoading(true);
    setPhone(formatted);
    const result = await signInWithPhone(formatted);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('otp');
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    const result = await verifyPhoneOtp(phone, otp);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('name');
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    saveLead({ name: fullName, phone }, 'phone_otp');
    if (fullName.trim()) {
      await updateProfile({ full_name: fullName.trim() } as any);
    }
    setStep('done');
    setTimeout(() => {
      setShow(false);
      window.location.reload();
    }, 1500);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <button onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#f8f8f8] transition-colors z-10">
          <X size={16} className="text-[#a1a3ad]" />
        </button>

        {/* Done */}
        {step === 'done' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00b386]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-[#00b386]" />
            </div>
            <h3 className="text-lg font-bold text-[#121212] mb-2">Account Created!</h3>
            <p className="text-sm text-[#7c7e8c]">Your progress is now saved permanently.</p>
          </div>
        )}

        {/* Prompt */}
        {step === 'prompt' && (
          <>
            <div style={{ background: 'rgba(0,179,134,0.04)' }} className="px-6 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#00b386]">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#121212]">Save Your Progress</h3>
                  <p className="text-xs text-[#7c7e8c]">Keep your data across devices</p>
                </div>
              </div>
              <p className="text-sm text-[#44475b] leading-relaxed">
                Create an account to save your portfolio, learning progress, and get daily DSE market insights.
              </p>
            </div>

            <div className="px-6 py-5 space-y-3">
              {/* WhatsApp — primary */}
              <button onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full font-bold text-[16px] transition-opacity hover:opacity-90 text-white"
                style={{ background: '#25D366' }}>
                <MessageCircle size={22} />
                Continue with WhatsApp
              </button>

              <p className="text-[11px] text-[#a1a3ad] text-center leading-snug">
                Message us on WhatsApp — we'll set up your account and help you get started.
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#e9e9eb]" />
                <span className="text-[11px] text-[#c7c8ce] font-medium">or</span>
                <div className="flex-1 h-px bg-[#e9e9eb]" />
              </div>

              {/* Phone OTP — secondary */}
              <button onClick={() => setStep('phone')}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-full font-semibold text-sm transition-colors hover:bg-[#f8f8f8] text-[#44475b]"
                style={{ border: '1px solid #e9e9eb' }}>
                <Phone size={16} />
                Sign up with Phone Number
              </button>

              <button type="button" onClick={handleDismiss}
                className="w-full text-center text-xs text-[#a1a3ad] hover:text-[#7c7e8c] py-1">
                Maybe later
              </button>
            </div>
          </>
        )}

        {/* Phone Input */}
        {step === 'phone' && (
          <div className="px-6 py-6">
            <button onClick={() => { setStep('prompt'); setError(''); }}
              className="flex items-center gap-1 text-xs text-[#a1a3ad] hover:text-[#7c7e8c] mb-4">
              <ArrowLeft size={14} /> Back
            </button>
            <h3 className="text-lg font-bold text-[#121212] mb-1">Enter your phone number</h3>
            <p className="text-sm text-[#7c7e8c] mb-5">We'll send a 6-digit verification code via SMS.</p>

            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#44475b] mb-1.5">
                  <Phone size={12} /> Phone Number
                </label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="01XXX XXXXXX"
                  autoFocus
                  className="w-full px-3.5 py-3 bg-[#f8f8f8] border border-[#e9e9eb] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#00b386]/20 focus:border-[#00b386]/30" />
              </div>

              {error && (
                <div className="text-xs text-[#eb5b3c] bg-[#eb5b3c]/5 border border-[#eb5b3c]/15 rounded-lg px-3 py-2">{error}</div>
              )}

              <button type="submit" disabled={loading || !phone.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 bg-[#00b386]">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Verification Code'}
              </button>
            </form>
          </div>
        )}

        {/* OTP Verification */}
        {step === 'otp' && (
          <div className="px-6 py-6">
            <button onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
              className="flex items-center gap-1 text-xs text-[#a1a3ad] hover:text-[#7c7e8c] mb-4">
              <ArrowLeft size={14} /> Change number
            </button>
            <h3 className="text-lg font-bold text-[#121212] mb-1">Enter verification code</h3>
            <p className="text-sm text-[#7c7e8c] mb-5">
              Sent to <strong className="text-[#44475b]">{phone}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <input ref={otpRef} type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-3.5 py-3 bg-[#f8f8f8] border border-[#e9e9eb] rounded-xl text-center text-2xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#00b386]/20 focus:border-[#00b386]/30" />

              {error && (
                <div className="text-xs text-[#eb5b3c] bg-[#eb5b3c]/5 border border-[#eb5b3c]/15 rounded-lg px-3 py-2">{error}</div>
              )}

              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 bg-[#00b386]">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify & Create Account'}
              </button>

              <button type="button" onClick={() => { setError(''); handleSendOtp(new Event('click') as any); }}
                className="w-full text-center text-xs text-[#a1a3ad] hover:text-[#7c7e8c] py-1">
                Resend code
              </button>
            </form>
          </div>
        )}

        {/* Name (optional) */}
        {step === 'name' && (
          <div className="px-6 py-6">
            <div className="w-12 h-12 rounded-full bg-[#00b386]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-[#00b386]" />
            </div>
            <h3 className="text-lg font-bold text-[#121212] text-center mb-1">Verified!</h3>
            <p className="text-sm text-[#7c7e8c] text-center mb-5">One last thing — what should we call you?</p>

            <form onSubmit={handleSaveName} className="space-y-3.5">
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                autoFocus
                className="w-full px-3.5 py-3 bg-[#f8f8f8] border border-[#e9e9eb] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#00b386]/20 focus:border-[#00b386]/30" />

              <button type="submit"
                className="w-full py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90 bg-[#00b386]">
                {fullName.trim() ? 'Save & Continue' : 'Skip'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
