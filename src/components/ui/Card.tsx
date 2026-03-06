import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export function Card({ children, className, padding = true, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card',
        padding && 'p-4 sm:p-5',
        hover && 'hover:bg-card-hover hover:border-border-light transition-all cursor-pointer',
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
}

export function StatCard({ title, value, subtitle, icon, iconColor, trend, gradient, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border p-4 sm:p-5 lg:p-6 min-h-[120px] sm:min-h-[140px] flex flex-col justify-between',
        gradient || 'bg-card',
        className
      )}
    >
      {/* Icon — top right */}
      {icon && (
        <div className={cn(
          'absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center',
          iconColor || 'bg-white/5 text-muted'
        )}>
          {icon}
        </div>
      )}

      {/* Content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">{title}</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-num leading-none text-white">{value}</p>

        {trend && (
          <p className={cn(
            'text-xs sm:text-sm font-semibold mt-1.5 font-num',
            trend.value >= 0 ? 'text-success' : 'text-danger'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(2)}%
          </p>
        )}

        {subtitle && !trend && (
          <p className="text-xs sm:text-sm text-white/50 mt-1.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
