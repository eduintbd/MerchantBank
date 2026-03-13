import { Outlet } from 'react-router-dom';
import { TopNav } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      {/* pt-[60px] = mobile header 52px + 8px breathing room */}
      {/* pb-[72px] = mobile bottom nav 56px + 16px breathing room */}
      {/* sm:pt-[60px] = desktop sticky header height */}
      <main className="pt-[60px] pb-[72px] sm:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
