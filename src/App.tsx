import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { TradingPage } from '@/pages/TradingPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { LearningPage } from '@/pages/LearningPage';
import { KycPage } from '@/pages/KycPage';
import { MarketingPage } from '@/pages/MarketingPage';
import { AdminOrdersPage } from '@/pages/AdminOrdersPage';
import { LandingPage } from '@/pages/LandingPage';
import type { ReactNode } from 'react';

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

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

// Public routes that don't need auth to load
const PUBLIC_PATHS = ['/market'];

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isPublicRoute = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));
  if (loading && !isPublicRoute) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

      {/* Public market page - no auth required */}
      <Route path="/market" element={<Suspense fallback={<PageLoader />}><MarketPage /></Suspense>} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Core pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />

        {/* New feature pages */}
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
