import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './Sidebar';
import { DemoModeBanner } from './DemoModeBanner';
import { CoachingOverlay } from '@/components/coaching/CoachingOverlay';
import { LeadCaptureModal } from '@/components/ui/LeadCaptureModal';
import { trackPageView, getVisitor } from '@/services/visitorTracker';

export function AppLayout() {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    getVisitor(); // Ensure visitor is initialized
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      <DemoModeBanner />
      <TopNav />
      <main className="pt-[52px] sm:pt-0 pb-[calc(60px+env(safe-area-inset-bottom,0px))] sm:pb-0">
        <Outlet />
      </main>
      <CoachingOverlay />
      <LeadCaptureModal />
    </div>
  );
}
