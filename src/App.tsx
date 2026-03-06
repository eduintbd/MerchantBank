import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-info rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg shadow-primary/30">
          H
        </div>
        <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted mt-3">Loading...</p>
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

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
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
                background: '#1a1a35',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
