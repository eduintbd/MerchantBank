import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useCreateLearnerProfile } from '@/hooks/useDemoAccount';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
  BarChart3,
  Shield,
  Target,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ExperienceLevel, RiskAppetite, PreferredLanguage } from '@/types/demo';

const STEPS = ['Welcome', 'Language', 'Experience', 'Risk', 'Goal'];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createDemoAccount } = useDemo();
  const createProfile = useCreateLearnerProfile();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [language, setLanguage] = useState<PreferredLanguage>('en');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');
  const [risk, setRisk] = useState<RiskAppetite>('moderate');
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canNext = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return true;
      case 2: return true;
      case 3: return true;
      case 4: return goal.trim().length > 0;
      default: return false;
    }
  };

  async function handleComplete() {
    try {
      setSubmitting(true);
      await createProfile.mutateAsync({
        experience_level: experience,
        risk_appetite: risk,
        learning_goal: goal,
        preferred_language: language,
      });
      await createDemoAccount();
      toast.success('Welcome aboard!', { description: 'Your demo account is ready.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Setup failed', { description: err?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (step === STEPS.length - 1) {
      handleComplete();
    } else {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#0b8a00]/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-[#0b8a00]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Welcome to Abaci Investments</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Practice trading Dhaka Stock Exchange securities with virtual money. Learn without risk, build real skills.
              </p>
            </div>
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled />
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Globe size={28} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Choose Your Language</h2>
              <p className="text-sm text-gray-500 mt-2">Select your preferred language for the platform.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'en' as const, label: 'English', desc: 'English interface' },
                { value: 'bn' as const, label: 'Bangla', desc: 'Bangla interface' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={cn(
                    'p-5 rounded-xl border-2 text-center transition-all duration-200',
                    language === lang.value
                      ? 'border-[#0b8a00] bg-[#0b8a00]/5 ring-1 ring-[#0b8a00]/20'
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                  )}
                >
                  <p className="font-semibold text-gray-900">{lang.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{lang.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={28} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Experience Level</h2>
              <p className="text-sm text-gray-500 mt-2">Tell us about your stock market experience.</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'beginner' as const, label: 'Beginner', desc: 'New to stock trading. Want to learn the basics.', color: 'bg-green-100 text-green-700' },
                { value: 'intermediate' as const, label: 'Intermediate', desc: 'Some experience with buying/selling stocks.', color: 'bg-blue-100 text-blue-700' },
                { value: 'advanced' as const, label: 'Advanced', desc: 'Experienced trader looking to practice strategies.', color: 'bg-purple-100 text-purple-700' },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setExperience(level.value)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                    experience === level.value
                      ? 'border-[#0b8a00] bg-[#0b8a00]/5'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  )}
                >
                  <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-xs font-bold', level.color)}>{level.label}</span>
                  <span className="text-sm text-gray-600">{level.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Risk Appetite</h2>
              <p className="text-sm text-gray-500 mt-2">How much risk are you comfortable with?</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'conservative' as const, label: 'Conservative', desc: 'Prefer safety over growth. Focus on blue-chip stocks and low volatility.', color: 'bg-green-100 text-green-700' },
                { value: 'moderate' as const, label: 'Moderate', desc: 'Balanced approach. Mix of stable and growth stocks.', color: 'bg-blue-100 text-blue-700' },
                { value: 'aggressive' as const, label: 'Aggressive', desc: 'High growth focus. Comfortable with volatility and active trading.', color: 'bg-red-100 text-red-700' },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRisk(r.value)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                    risk === r.value
                      ? 'border-[#0b8a00] bg-[#0b8a00]/5'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('inline-flex px-2.5 py-0.5 rounded-lg text-xs font-bold', r.color)}>{r.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Target size={28} className="text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your Learning Goal</h2>
              <p className="text-sm text-gray-500 mt-2">What do you want to achieve with demo trading?</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Your Goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. I want to learn how to analyze stocks and build a diversified portfolio..."
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/20 focus:border-[#0b8a00]/40 resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                i === step ? 'bg-[#0b8a00] scale-125' : i < step ? 'bg-[#0b8a00]/40 cursor-pointer' : 'bg-gray-200'
              )}
              title={s}
              disabled={i > step}
            />
          </div>
        ))}
      </div>

      <Card variant="elevated" className="p-6 sm:p-8">
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            icon={<ChevronLeft size={16} />}
          >
            Back
          </Button>
          <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!canNext() || submitting}
            loading={submitting}
            icon={step === STEPS.length - 1 ? undefined : <ChevronRight size={16} />}
          >
            {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
