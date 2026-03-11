import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Users,
  LogOut,
  ClipboardList,
  Menu,
  X,
  MessageSquare,
  Rocket,
  MoreHorizontal,
  BarChart3,
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

  // Desktop shows all items
  const desktopNavItems = navItems;

  // Mobile bottom nav: Home, Trade, Portfolio, Social, More
  const mobileBottomItems = [
    baseNavItems[0], // Home
    baseNavItems[1], // Market
    baseNavItems[2], // Trade
    baseNavItems[3], // Portfolio
    moreNavItem,     // More
  ];

  return (
    <>
      {/* Desktop Top Header */}
      <header className="sticky top-0 z-40 hidden sm:block bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <div className="flex items-center gap-3.5 shrink-0">
              <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
              <div>
                <span className="font-bold text-base text-foreground tracking-tight">HeroStock.AI</span>
                <p className="text-[10px] text-muted leading-none mt-0.5">Investment Platform</p>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <nav className="flex items-center gap-0.5 lg:gap-1 overflow-x-auto scrollbar-hide">
              {desktopNavItems.map(item => {
                const isActive = item.to === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium transition-all duration-200 whitespace-nowrap group',
                      isActive
                        ? 'text-primary'
                        : 'text-muted hover:text-foreground'
                    )}
                  >
                    <item.icon size={15} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {/* Animated underline */}
                    <span className={cn(
                      'absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary transition-all duration-300 ease-out',
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    )} />
                  </NavLink>
                );
              })}
            </nav>

            {/* User + Sign Out */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{user?.full_name || 'User'}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-muted hover:text-danger px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-200 hover:bg-danger/8"
                title="Sign Out"
              >
                <LogOut size={15} strokeWidth={1.8} />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 sm:hidden bg-gradient-to-r from-white via-white to-gray-50/80 border-b border-border/80 shadow-sm">
        <div className="flex items-center justify-between px-3.5" style={{ height: 52 }}>
          <div className="flex items-center gap-2.5">
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            <span className="font-bold text-sm text-foreground tracking-tight">HeroStock.AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-semibold shadow-sm">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" />
          <div
            className="absolute top-[52px] left-0 right-0 bg-white border-b border-border shadow-2xl max-h-[80vh] overflow-y-auto"
            style={{ animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* User info */}
            <div className="px-4 py-4 border-b border-border bg-gradient-to-r from-surface to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* All nav items */}
            <div className="py-2">
              {navItems.map(item => {
                const isActive = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all duration-200 relative',
                      isActive
                        ? 'text-primary bg-primary/5'
                        : 'text-foreground hover:bg-gray-50 active:bg-gray-100'
                    )}
                  >
                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />}
                    <item.icon size={18} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Sign out */}
            <div className="border-t border-border px-5 py-4">
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 text-sm font-medium text-danger w-full py-2 hover:bg-danger/5 rounded-lg px-2 -mx-2 transition-colors duration-200"
              >
                <LogOut size={18} strokeWidth={1.8} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="h-16 grid grid-cols-5 safe-bottom">
          {mobileBottomItems.map(item => {
            const isActive = item.to === '/dashboard'
              ? location.pathname === '/dashboard'
              : item.to === '/more'
                ? location.pathname === '/more'
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-1 transition-all duration-200"
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={cn(
                    'transition-all duration-200',
                    isActive ? 'text-primary -translate-y-0.5' : 'text-muted-foreground'
                  )}
                />
                <span className={cn(
                  'text-[9px] font-medium leading-none transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
                {/* Active indicator dot */}
                <span className={cn(
                  'w-1 h-1 rounded-full bg-primary transition-all duration-300',
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                )} />
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Slide-down animation keyframe injected as style */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
