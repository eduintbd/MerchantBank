import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DemoProvider } from '@/contexts/DemoContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { TradingPage } from '@/pages/TradingPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { LearningPage } from '@/pages/LearningPage';
import type { ReactNode } from 'react';

// Lazy-loaded auth/landing/admin pages (not needed on dashboard entry)
const AuthPage = lazy(() => import('@/pages/AuthPage').then(m => ({ default: m.AuthPage })));
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const MarketingPage = lazy(() => import('@/pages/MarketingPage').then(m => ({ default: m.MarketingPage })));
const KycPage = lazy(() => import('@/pages/KycPage').then(m => ({ default: m.KycPage })));
const AdminOrdersPage = lazy(() => import('@/pages/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));

// Lazy-loaded new pages
const HalalStocksPage = lazy(() => import('@/pages/HalalStocksPage').then(m => ({ default: m.HalalStocksPage })));
const WomenInvestorsPage = lazy(() => import('@/pages/WomenInvestorsPage').then(m => ({ default: m.WomenInvestorsPage })));
const MarketHistoryPage = lazy(() => import('@/pages/MarketHistoryPage').then(m => ({ default: m.MarketHistoryPage })));
const BsecRulesPage = lazy(() => import('@/pages/BsecRulesPage').then(m => ({ default: m.BsecRulesPage })));
const TraderBiographiesPage = lazy(() => import('@/pages/TraderBiographiesPage').then(m => ({ default: m.TraderBiographiesPage })));
const SocialFeedPage = lazy(() => import('@/pages/SocialFeedPage').then(m => ({ default: m.SocialFeedPage })));
const IpoPage = lazy(() => import('@/pages/IpoPage').then(m => ({ default: m.IpoPage })));
const StockDetailPage = lazy(() => import('@/pages/StockDetailPage').then(m => ({ default: m.StockDetailPage })));
const FinanceTrackerPage = lazy(() => import('@/pages/FinanceTrackerPage').then(m => ({ default: m.FinanceTrackerPage })));
const TopInvestorsPage = lazy(() => import('@/pages/TopInvestorsPage').then(m => ({ default: m.TopInvestorsPage })));
const ZeroToHeroPage = lazy(() => import('@/pages/ZeroToHeroPage').then(m => ({ default: m.ZeroToHeroPage })));
const MorePage = lazy(() => import('@/pages/MorePage').then(m => ({ default: m.MorePage })));
const PortfolioAnalysisPage = lazy(() => import('@/pages/PortfolioAnalysisPage').then(m => ({ default: m.PortfolioAnalysisPage })));
const NotificationSettingsPage = lazy(() => import('@/pages/NotificationSettingsPage').then(m => ({ default: m.NotificationSettingsPage })));
const MarketPage = lazy(() => import('@/pages/MarketPage').then(m => ({ default: m.MarketPage })));

// Demo Trading + Learning pages
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DemoTradingPage = lazy(() => import('@/pages/DemoTradingPage').then(m => ({ default: m.DemoTradingPage })));
const DemoPortfolioPage = lazy(() => import('@/pages/DemoPortfolioPage').then(m => ({ default: m.DemoPortfolioPage })));
const CashLedgerPage = lazy(() => import('@/pages/CashLedgerPage').then(m => ({ default: m.CashLedgerPage })));
const EodReplayPage = lazy(() => import('@/pages/EodReplayPage').then(m => ({ default: m.EodReplayPage })));
const DemoReportsPage = lazy(() => import('@/pages/DemoReportsPage').then(m => ({ default: m.DemoReportsPage })));
const AdminLearnersPage = lazy(() => import('@/pages/AdminLearnersPage').then(m => ({ default: m.AdminLearnersPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover shadow-lg" />
        <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted mt-3">Loading...</p>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted">Loading...</span>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  const location = useLocation();
  if (loading && !location.pathname.startsWith('/market')) return <LoadingScreen />;

  return (
    <Routes>
      {/* Landing page — always accessible, users can explore or go to dashboard */}
      <Route path="/landing" element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />

      {/* Auth page — available for guests who want to create a real account */}
      <Route path="/auth" element={<Suspense fallback={<PageLoader />}><AuthPage /></Suspense>} />

      {/* Market page — open to everyone */}
      <Route path="/market" element={<Suspense fallback={<PageLoader />}><MarketPage /></Suspense>} />

      {/* All app routes — no auth gate, guest auto-login handles it */}
      <Route element={<AppLayout />}>
        {/* Default: send / to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Core pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/kyc" element={<Suspense fallback={<PageLoader />}><KycPage /></Suspense>} />
        <Route path="/marketing" element={<Suspense fallback={<PageLoader />}><MarketingPage /></Suspense>} />
        <Route path="/admin/orders" element={<Suspense fallback={<PageLoader />}><AdminOrdersPage /></Suspense>} />

        {/* Feature pages */}
        <Route path="/halal" element={<Suspense fallback={<PageLoader />}><HalalStocksPage /></Suspense>} />
        <Route path="/women-investors" element={<Suspense fallback={<PageLoader />}><WomenInvestorsPage /></Suspense>} />
        <Route path="/market-history" element={<Suspense fallback={<PageLoader />}><MarketHistoryPage /></Suspense>} />
        <Route path="/bsec-rules" element={<Suspense fallback={<PageLoader />}><BsecRulesPage /></Suspense>} />
        <Route path="/trader-bios" element={<Suspense fallback={<PageLoader />}><TraderBiographiesPage /></Suspense>} />
        <Route path="/social" element={<Suspense fallback={<PageLoader />}><SocialFeedPage /></Suspense>} />
        <Route path="/ipo" element={<Suspense fallback={<PageLoader />}><IpoPage /></Suspense>} />
        <Route path="/stock/:symbol" element={<Suspense fallback={<PageLoader />}><StockDetailPage /></Suspense>} />
        <Route path="/finance" element={<Suspense fallback={<PageLoader />}><FinanceTrackerPage /></Suspense>} />
        <Route path="/investors" element={<Suspense fallback={<PageLoader />}><TopInvestorsPage /></Suspense>} />
        <Route path="/zero-to-hero" element={<Suspense fallback={<PageLoader />}><ZeroToHeroPage /></Suspense>} />
        <Route path="/more" element={<Suspense fallback={<PageLoader />}><MorePage /></Suspense>} />
        <Route path="/portfolio/analysis" element={<Suspense fallback={<PageLoader />}><PortfolioAnalysisPage /></Suspense>} />
        <Route path="/notifications/settings" element={<Suspense fallback={<PageLoader />}><NotificationSettingsPage /></Suspense>} />

        {/* Demo Trading + Learning routes */}
        <Route path="/demo/trading" element={<Suspense fallback={<PageLoader />}><DemoTradingPage /></Suspense>} />
        <Route path="/demo/portfolio" element={<Suspense fallback={<PageLoader />}><DemoPortfolioPage /></Suspense>} />
        <Route path="/demo/ledger" element={<Suspense fallback={<PageLoader />}><CashLedgerPage /></Suspense>} />
        <Route path="/demo/eod" element={<Suspense fallback={<PageLoader />}><EodReplayPage /></Suspense>} />
        <Route path="/demo/reports" element={<Suspense fallback={<PageLoader />}><DemoReportsPage /></Suspense>} />
        <Route path="/admin/learners" element={<Suspense fallback={<PageLoader />}><AdminLearnersPage /></Suspense>} />
      </Route>

      {/* Onboarding — standalone page */}
      <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AppShell() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <DemoProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#1e293b',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            },
          }}
        />
      </DemoProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
