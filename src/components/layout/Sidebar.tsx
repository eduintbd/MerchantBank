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
} from 'lucide-react';

const baseNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
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
    baseNavItems[1], // Trade
    baseNavItems[2], // Portfolio
    baseNavItems[5], // Social
    moreNavItem,     // More
  ];

  return (
    <>
      {/* Desktop Top Header */}
      <header className="sticky top-0 z-40 hidden sm:block" style={{
        background: 'rgba(19,25,40,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <div className="flex items-center gap-3.5 shrink-0">
              <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-9 h-9 rounded-xl object-cover" />
              <div>
                <span className="font-bold text-base text-foreground tracking-tight" style={{ fontFamily: "'Ubuntu', sans-serif" }}>HeroStock.AI</span>
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
                      'relative flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium transition-all duration-300 whitespace-nowrap group',
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
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{user?.full_name || 'User'}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-muted hover:text-danger px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-300 hover:bg-danger/10"
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
      <header className="fixed top-0 left-0 right-0 z-50 sm:hidden" style={{
        background: 'rgba(19,25,40,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="flex items-center justify-between px-3.5" style={{ height: 52 }}>
          <div className="flex items-center gap-2.5">
            <img src="/herostock-logo.jpeg" alt="HeroStock.AI" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-sm text-foreground tracking-tight" style={{ fontFamily: "'Ubuntu', sans-serif" }}>HeroStock.AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-semibold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-300"
              style={{ background: mobileMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent' }}
            >
              {mobileMenuOpen ? <X size={20} className="text-foreground" /> : <Menu size={20} className="text-foreground" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" />
          <div
            className="absolute top-[52px] left-0 right-0 max-h-[80vh] overflow-y-auto"
            style={{
              background: '#1D263A',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* User info */}
            <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
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
                      'flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all duration-300 relative',
                      isActive
                        ? 'text-primary'
                        : 'text-muted hover:text-foreground'
                    )}
                    style={isActive ? { background: 'rgba(5,184,4,0.08)' } : undefined}
                  >
                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />}
                    <item.icon size={18} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Sign out */}
            <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 text-sm font-medium text-danger w-full py-2 hover:bg-danger/8 rounded-lg px-2 -mx-2 transition-colors duration-300"
              >
                <LogOut size={18} strokeWidth={1.8} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden" style={{
        background: 'rgba(19,25,40,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
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
                className="flex flex-col items-center justify-center gap-1 transition-all duration-300"
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={cn(
                    'transition-all duration-300',
                    isActive ? 'text-primary -translate-y-0.5' : 'text-muted-foreground'
                  )}
                />
                <span className={cn(
                  'text-[9px] font-medium leading-none transition-colors duration-300',
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
