import { Outlet } from 'react-router-dom';
import { TopNav } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      {/* pt accounts for: mobile header 52px / desktop header 60px */}
      {/* pb accounts for: mobile bottom nav 64px + 8px breathing */}
      <main className="pt-[52px] sm:pt-[60px] pb-[72px] sm:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
