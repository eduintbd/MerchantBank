import { Outlet } from 'react-router-dom';
import { TopNav } from './Sidebar';
import { DemoModeBanner } from './DemoModeBanner';
import { CoachingOverlay } from '@/components/coaching/CoachingOverlay';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <DemoModeBanner />
      <TopNav />
      <main className="pt-[52px] sm:pt-0 pb-[60px] sm:pb-0">
        <Outlet />
      </main>
      <CoachingOverlay />
    </div>
  );
}
