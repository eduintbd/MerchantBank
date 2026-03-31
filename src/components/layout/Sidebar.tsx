import { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, TrendingUp, Briefcase, GraduationCap, ShieldCheck,
  Users, LogOut, ClipboardList, Menu, X, MessageSquare, Rocket,
  MoreHorizontal, BarChart3, PlayCircle, FileText, Wallet, UserCog,
  UserPlus,
} from 'lucide-react';

const liveNavItems = [
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

const demoNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/market', icon: BarChart3, label: 'Market' },
  { to: '/demo/trading', icon: TrendingUp, label: 'Trade' },
  { to: '/demo/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/demo/ledger', icon: Wallet, label: 'Ledger' },
  { to: '/demo/eod', icon: PlayCircle, label: 'EOD' },
  { to: '/demo/reports', icon: FileText, label: 'Reports' },
  { to: '/learning', icon: GraduationCap, label: 'Learn' },
];

const adminNavItem = { to: '/admin/orders', icon: ClipboardList, label: 'Orders' };
const adminLearnersItem = { to: '/admin/learners', icon: UserCog, label: 'Learners' };
const moreNavItem = { to: '/more', icon: MoreHorizontal, label: 'More' };

export function TopNav() {
  const { user, isAdmin, isGuest, signOut } = useAuth();
  const { isDemoMode } = useDemo();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const baseNavItems = isDemoMode ? demoNavItems : liveNavItems;
  const adminItems = isAdmin ? [adminNavItem, ...(isDemoMode ? [adminLearnersItem] : [])] : [];
  const navItems = [...baseNavItems, ...adminItems, moreNavItem];
  const desktopNavItems = navItems;
  const mobileBottomItems = [baseNavItems[0], baseNavItems[1], baseNavItems[2], baseNavItems[3], moreNavItem];

  const displayName = isGuest ? 'Guest' : (user?.full_name || 'User');
  const displayInitial = isGuest ? 'G' : (user?.full_name?.charAt(0)?.toUpperCase() || 'U');

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 hidden sm:block bg-white" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-[56px]">
            <div className="flex items-center gap-2.5 shrink-0">
              <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-8 h-8 rounded object-cover" />
              <span className="font-bold text-base text-[#333]">HeroStock.AI</span>
            </div>

            <nav className="flex items-center gap-0.5 lg:gap-1 overflow-x-auto scrollbar-hide">
              {desktopNavItems.map(item => {
                const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
                    className={cn('group flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3.5 py-1.5 lg:py-2 text-[11px] lg:text-[13px] font-semibold whitespace-nowrap rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-[#0b8a00]/10 text-[#0b8a00]'
                        : 'text-[#777] hover:bg-[#f5f5f5] hover:text-[#333]'
                    )}>
                    <item.icon size={14} strokeWidth={isActive ? 2.2 : 1.8} className="transition-transform duration-200 group-hover:scale-110 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                  isGuest ? 'bg-gray-400' : 'bg-[#0b8a00]'
                )}>
                  {displayInitial}
                </div>
                <span className="text-sm font-semibold text-[#333] hidden lg:block truncate max-w-[120px]">{displayName}</span>
              </div>
              {isGuest ? (
                <Link to="/auth" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0b8a00] rounded-lg hover:brightness-110 transition-all" title="Create Account">
                  <UserPlus size={13} />
                  <span className="hidden lg:inline">Sign Up</span>
                </Link>
              ) : (
                <button onClick={signOut} className="text-sm text-[#aaa] hover:text-[#d32f2f] transition-colors" title="Sign Out">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 sm:hidden bg-white" style={{ borderBottom: '1px solid #e5e5e5', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-3" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-6 h-6 rounded object-cover" />
            <span className="font-bold text-sm text-[#333]">HeroStock.AI</span>
          </div>
          <div className="flex items-center gap-2">
            {isGuest && (
              <Link to="/auth" className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-[#0b8a00] rounded-md">
                <UserPlus size={11} />
                Sign Up
              </Link>
            )}
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
              isGuest ? 'bg-gray-400' : 'bg-[#0b8a00]'
            )}>
              {displayInitial}
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
          <div className="absolute left-0 right-0 max-h-[80vh] overflow-y-auto bg-white" style={{ top: 'calc(52px + env(safe-area-inset-top, 0px))', borderBottom: '1px solid #e5e5e5', animation: 'slideDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <p className="text-sm font-semibold text-[#333]">{displayName}</p>
              <p className="text-xs text-[#aaa]">{isGuest ? 'Guest account — no sign-up required' : user?.email}</p>
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
              {isGuest ? (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 text-sm font-medium text-[#0b8a00]">
                  <UserPlus size={16} strokeWidth={1.8} />
                  <span>Create Account</span>
                </Link>
              ) : (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex items-center gap-2.5 text-sm font-medium text-[#d32f2f]">
                  <LogOut size={16} strokeWidth={1.8} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white" style={{ borderTop: '1px solid #e5e5e5', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="h-14 grid grid-cols-5">
          {mobileBottomItems.map(item => {
            const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : item.to === '/more' ? location.pathname === '/more' : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} className="flex flex-col items-center justify-center gap-0.5 min-w-0">
                <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.5} className={cn('shrink-0', isActive ? 'text-[#0b8a00]' : 'text-[#aaa]')} />
                <span className={cn('text-[9px] sm:text-[10px] font-medium truncate max-w-full', isActive ? 'text-[#0b8a00]' : 'text-[#aaa]')}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}
