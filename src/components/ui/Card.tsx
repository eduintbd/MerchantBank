import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'glass';
}

export function Card({ children, className, padding = true, hover, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        variant === 'default' && 'border-border bg-card-solid shadow-[var(--shadow-card)]',
        variant === 'elevated' && 'border-border bg-card-solid shadow-[var(--shadow-elevated)]',
        variant === 'glass' && 'glass-card',
        padding && 'p-4 sm:p-5',
        hover && 'hover:shadow-[var(--shadow-elevated)] hover:border-border-light hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  iconColor?: string;
  trend?: { value: number; label?: string };
  gradient?: string;
  className?: string;
  sparkline?: ReactNode;
}

export function StatCard({ title, value, subtitle, icon, iconColor, trend, gradient, className, sparkline }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border p-4 sm:p-5 min-h-[110px] sm:min-h-[128px] flex flex-col justify-between transition-all duration-300 hover-lift',
        gradient || 'bg-card-solid',
        'shadow-[var(--shadow-card)]',
        className
      )}
    >
      {/* Icon — top right */}
      {icon && (
        <div className={cn(
          'absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
          iconColor || 'bg-white/[0.04] text-muted'
        )}>
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[10px] sm:text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">{title}</p>
        <p className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-num leading-none text-foreground tracking-tight">{value}</p>

        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold font-num',
              trend.value >= 0
                ? 'bg-success/12 text-success'
                : 'bg-danger/12 text-danger'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(2)}%
            </span>
          )}

          {trend?.label && (
            <span className="text-[10px] sm:text-[11px] text-muted">{trend.label}</span>
          )}

          {subtitle && !trend && (
            <p className="text-[11px] sm:text-xs text-muted truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Sparkline area */}
      {sparkline && (
        <div className="mt-2 h-8 sm:h-10 w-full">
          {sparkline}
        </div>
      )}
    </div>
  );
}
