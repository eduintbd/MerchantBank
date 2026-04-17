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
      <header className="sticky top-0 z-40 hidden sm:block bg-white/95 backdrop-blur-xl" style={{ borderBottom: '1px solid #e1e5ee' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }} className="px-4 lg:px-8">
          <div className="flex items-center justify-between h-[58px]">
            {/* Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a2744] to-[#2a3f6b] flex items-center justify-center shadow-sm">
                <span className="text-[#c9a96e] font-bold text-sm tracking-tight">A</span>
              </div>
              <div className="hidden lg:block">
                <span className="font-bold text-[15px] text-[#1a2138] tracking-tight">Abaci</span>
                <span className="text-[10px] text-[#9ba3b5] block -mt-0.5 font-medium tracking-wider uppercase">Investments</span>
              </div>
              <span className="lg:hidden font-bold text-[15px] text-[#1a2138] tracking-tight">Abaci</span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
              {desktopNavItems.map(item => {
                const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
                    className={cn(
                      'group flex items-center gap-1.5 px-3 lg:px-3.5 py-2 text-[12px] lg:text-[13px] font-semibold whitespace-nowrap rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-[#1a2744]/[0.06] text-[#1a2744]'
                        : 'text-[#7c8498] hover:bg-[#f0f2f7] hover:text-[#2d3348]'
                    )}>
                    <item.icon size={15} strokeWidth={isActive ? 2.2 : 1.7} className="transition-transform duration-200 group-hover:scale-105 shrink-0" />
                    <span>{item.label}</span>
                    {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-[#c9a96e]" />}
                  </NavLink>
                );
              })}
            </nav>

            {/* User */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm transition-all',
                  isGuest
                    ? 'bg-[#e1e5ee] text-[#7c8498]'
                    : 'bg-gradient-to-br from-[#1a2744] to-[#2a3f6b] text-[#c9a96e]'
                )}>
                  {displayInitial}
                </div>
                <span className="text-[13px] font-semibold text-[#2d3348] hidden lg:block truncate max-w-[120px]">{displayName}</span>
              </div>
              {isGuest ? (
                <Link to="/auth" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#1a2744] to-[#2a3f6b] rounded-lg hover:shadow-md transition-all" title="Create Account">
                  <UserPlus size={13} />
                  <span className="hidden lg:inline">Get Started</span>
                </Link>
              ) : (
                <button onClick={signOut} className="text-[#9ba3b5] hover:text-[#c53030] transition-colors p-1.5 rounded-lg hover:bg-[#f0f2f7]" title="Sign Out">
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-xl" style={{ borderBottom: '1px solid #e1e5ee', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4" style={{ height: 52 }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a2744] to-[#2a3f6b] flex items-center justify-center">
              <span className="text-[#c9a96e] font-bold text-[11px]">A</span>
            </div>
            <span className="font-bold text-sm text-[#1a2138] tracking-tight">Abaci</span>
          </div>
          <div className="flex items-center gap-2">
            {isGuest && (
              <Link to="/auth" className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-[#1a2744] to-[#2a3f6b] rounded-md">
                <UserPlus size={10} />
                Sign Up
              </Link>
            )}
            <div className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold',
              isGuest ? 'bg-[#e1e5ee] text-[#7c8498]' : 'bg-gradient-to-br from-[#1a2744] to-[#2a3f6b] text-[#c9a96e]'
            )}>
              {displayInitial}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f2f7]">
              {mobileMenuOpen ? <X size={18} className="text-[#2d3348]" /> : <Menu size={18} className="text-[#7c8498]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-[#1a2744]/40 backdrop-blur-sm" />
          <div className="absolute left-0 right-0 max-h-[80vh] overflow-y-auto bg-white" style={{ top: 'calc(52px + env(safe-area-inset-top, 0px))', borderBottom: '1px solid #e1e5ee', animation: 'slideDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #ebeef5' }}>
              <p className="text-sm font-semibold text-[#1a2138]">{displayName}</p>
              <p className="text-xs text-[#9ba3b5]">{isGuest ? 'Guest account' : user?.email}</p>
            </div>
            <div className="py-1">
              {navItems.map(item => {
                const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
                return (
                  <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                    className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'text-[#1a2744] bg-[#1a2744]/[0.04]' : 'text-[#7c8498] hover:bg-[#f0f2f7]')}>
                    <item.icon size={16} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-[#c9a96e]" />}
                  </NavLink>
                );
              })}
            </div>
            <div className="px-4 py-3" style={{ borderTop: '1px solid #ebeef5' }}>
              {isGuest ? (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 text-sm font-semibold text-[#1a2744]">
                  <UserPlus size={16} strokeWidth={1.8} />
                  <span>Create Account</span>
                </Link>
              ) : (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex items-center gap-2.5 text-sm font-medium text-[#c53030]">
                  <LogOut size={16} strokeWidth={1.8} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-xl" style={{ borderTop: '1px solid #e1e5ee', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="h-14 grid grid-cols-5">
          {mobileBottomItems.map(item => {
            const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : item.to === '/more' ? location.pathname === '/more' : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} className="flex flex-col items-center justify-center gap-0.5 min-w-0 relative">
                {isActive && <div className="absolute top-0 w-6 h-[2px] rounded-b-full bg-[#c9a96e]" />}
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={cn('shrink-0 transition-colors', isActive ? 'text-[#1a2744]' : 'text-[#9ba3b5]')} />
                <span className={cn('text-[9px] font-semibold truncate max-w-full transition-colors', isActive ? 'text-[#1a2744]' : 'text-[#9ba3b5]')}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}
