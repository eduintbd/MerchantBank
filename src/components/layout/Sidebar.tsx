import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, TrendingUp, Briefcase, GraduationCap, ShieldCheck,
  Users, LogOut, ClipboardList, Menu, X, MessageSquare, Rocket,
  MoreHorizontal, BarChart3,
} from 'lucide-react';

const baseNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/market', icon: BarChart3, label: 'Market' },
  { to: '/trading', icon: TrendingUp, label: 'Trade' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/learning', icon: GraduationCap, label: 'Learn' },
  { to: '/ipo', icon: Rocket, label: 'IPO' },
  { to: '/social', icon: MessageSquare, label: 'Social' },
  { to: '/kyc', icon: ShieldCheck, label: 'KYC' },
  { to: '/marketing', icon: Users, label: 'Refer' },
];

const adminNavItem = { to: '/admin/orders', icon: ClipboardList, label: 'Orders' };
const moreNavItem = { to: '/more', icon: MoreHorizontal, label: 'More' };

export function TopNav() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [...baseNavItems, ...(isAdmin ? [adminNavItem] : []), moreNavItem];
  const desktopNavItems = navItems;
  const mobileBottomItems = [baseNavItems[0], baseNavItems[1], baseNavItems[2], baseNavItems[3], moreNavItem];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 hidden sm:block bg-white" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="flex items-center justify-between h-[56px]">
            <div className="flex items-center gap-2.5 shrink-0">
              <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-8 h-8 rounded object-cover" />
              <span className="font-bold text-base text-[#333]">HeroStock.AI</span>
            </div>

            <nav className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {desktopNavItems.map(item => {
                const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
                    className={cn('flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors',
                      isActive ? 'border-[#0b8a00] text-[#0b8a00]' : 'border-transparent text-[#888] hover:text-[#333]'
                    )}>
                    <item.icon size={15} strokeWidth={2} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0b8a00] flex items-center justify-center text-white text-xs font-bold">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-semibold text-[#333] hidden lg:block truncate max-w-[120px]">{user?.full_name || 'User'}</span>
              </div>
              <button onClick={signOut} className="text-sm text-[#aaa] hover:text-[#d32f2f] transition-colors" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 sm:hidden bg-white" style={{ borderBottom: '1px solid #e5e5e5', height: 52 }}>
        <div className="flex items-center justify-between px-3 h-full">
          <div className="flex items-center gap-2">
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-6 h-6 rounded object-cover" />
            <span className="font-bold text-sm text-[#333]">HeroStock.AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0b8a00] flex items-center justify-center text-white text-[10px] font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-7 h-7 flex items-center justify-center">
              {mobileMenuOpen ? <X size={18} className="text-[#333]" /> : <Menu size={18} className="text-[#333]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute top-[48px] left-0 right-0 max-h-[80vh] overflow-y-auto bg-white" style={{ borderBottom: '1px solid #e5e5e5', animation: 'slideDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <p className="text-sm font-semibold text-[#333]">{user?.full_name || 'User'}</p>
              <p className="text-xs text-[#aaa]">{user?.email}</p>
            </div>
            <div className="py-1">
              {navItems.map(item => {
                const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
                return (
                  <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                    className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium', isActive ? 'text-[#0b8a00] bg-[#f0faf0]' : 'text-[#666] hover:bg-[#f9f9f9]')}>
                    <item.icon size={16} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            <div className="px-4 py-3" style={{ borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex items-center gap-2.5 text-sm font-medium text-[#d32f2f]">
                <LogOut size={16} strokeWidth={1.8} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white" style={{ borderTop: '1px solid #e5e5e5' }}>
        <div className="h-14 grid grid-cols-5 safe-bottom">
          {mobileBottomItems.map(item => {
            const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : item.to === '/more' ? location.pathname === '/more' : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} className="flex flex-col items-center justify-center gap-0.5">
                <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.5} className={isActive ? 'text-[#0b8a00]' : 'text-[#aaa]'} />
                <span className={cn('text-[10px] font-medium', isActive ? 'text-[#0b8a00]' : 'text-[#aaa]')}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}
