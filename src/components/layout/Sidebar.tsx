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
} from 'lucide-react';

const baseNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/trading', icon: TrendingUp, label: 'Trade' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/learning', icon: GraduationCap, label: 'Learn' },
  { to: '/kyc', icon: ShieldCheck, label: 'KYC' },
  { to: '/marketing', icon: Users, label: 'Refer' },
];

const adminNavItem = { to: '/admin/orders', icon: ClipboardList, label: 'Orders' };

export function TopNav() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Desktop Top Header */}
      <header className="sticky top-0 z-40 hidden sm:block border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center text-white font-bold text-sm">
                H
              </div>
              <div>
                <span className="font-semibold text-base text-foreground">Hero</span>
                <p className="text-[10px] text-muted leading-none mt-0.5">Investment Platform</p>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <nav className="flex items-center gap-1 lg:gap-2">
              {[...baseNavItems, ...(isAdmin ? [adminNavItem] : [])].map(item => {
                const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-info/10 text-info'
                        : 'text-muted hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    <item.icon size={16} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* User + Sign Out */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{user?.full_name || 'User'}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-muted hover:text-danger px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-danger/10"
                title="Sign Out"
              >
                <LogOut size={15} strokeWidth={1.8} />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 sm:hidden glass border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center text-white font-bold text-[10px]">
              H
            </div>
            <span className="font-semibold text-sm text-foreground">Hero</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-[9px] font-semibold">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden glass border-t border-border safe-bottom">
        <div className={cn('h-14 grid', isAdmin ? 'grid-cols-7' : 'grid-cols-6')}>
          {[...baseNavItems, ...(isAdmin ? [adminNavItem] : [])].map(item => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-[3px]"
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={cn('transition-colors', isActive ? 'text-info' : 'text-muted-foreground')}
                />
                <span className={cn(
                  'text-[9px] font-medium leading-none',
                  isActive ? 'text-info' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
