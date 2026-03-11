import { Outlet } from 'react-router-dom';
import { TopNav } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      {/* pt-[60px] = mobile header 52px + 8px breathing room */}
      {/* pb-[72px] = mobile bottom nav 56px + 16px breathing room */}
      <main className="pt-[60px] pb-[72px] sm:pt-0 sm:pb-0">
        <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
