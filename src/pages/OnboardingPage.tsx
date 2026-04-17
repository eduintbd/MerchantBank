import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0b8a00] flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Abaci Investments</span>
        </div>
        <p className="text-sm text-gray-500">Demo Trading Platform</p>
      </div>

      <OnboardingWizard />

      <p className="mt-8 text-xs text-gray-400 text-center">
        Practice trading with virtual money. No real money is involved.
      </p>
    </div>
  );
}
