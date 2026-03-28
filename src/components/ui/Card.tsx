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
        'rounded-xl border transition-all duration-300',
        variant === 'default' && 'border-gray-200 bg-white shadow-sm',
        variant === 'elevated' && 'border-gray-200 bg-white shadow-md',
        variant === 'glass' && 'glass-card',
        padding && 'p-4 sm:p-5',
        hover && 'hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer',
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
        'relative overflow-hidden rounded-xl border border-gray-200 p-4 sm:p-5 min-h-[110px] sm:min-h-[128px] flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
        gradient || 'bg-white',
        'shadow-sm',
        className
      )}
    >
      {icon && (
        <div className={cn(
          'absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
          iconColor || 'bg-gray-100 text-gray-500'
        )}>
          {icon}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{title}</p>
        <p className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-num leading-none text-gray-900 tracking-tight">{value}</p>

        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold font-num',
              trend.value >= 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(2)}%
            </span>
          )}

          {trend?.label && (
            <span className="text-[10px] sm:text-[11px] text-gray-500">{trend.label}</span>
          )}

          {subtitle && !trend && (
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {sparkline && (
        <div className="mt-2 h-8 sm:h-10 w-full">
          {sparkline}
        </div>
      )}
    </div>
  );
}
