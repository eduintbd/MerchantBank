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
        variant === 'default' && 'border-[#e1e5ee] bg-white shadow-[0_1px_3px_rgba(26,33,56,0.04)]',
        variant === 'elevated' && 'border-[#e1e5ee] bg-white shadow-[0_4px_16px_rgba(26,33,56,0.08)]',
        variant === 'glass' && 'border-white/10 bg-white/60 backdrop-blur-xl shadow-[0_2px_12px_rgba(26,33,56,0.06)]',
        padding && 'p-5 sm:p-6',
        hover && 'hover:shadow-[0_6px_20px_rgba(26,33,56,0.1)] hover:border-[#c9a96e]/20 hover:-translate-y-0.5 cursor-pointer',
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
        'relative overflow-hidden rounded-2xl border border-[#e1e5ee] p-4 sm:p-5 min-h-[110px] sm:min-h-[128px] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_4px_16px_rgba(26,33,56,0.08)] hover:-translate-y-0.5',
        gradient || 'bg-white',
        'shadow-[0_1px_3px_rgba(26,33,56,0.04)]',
        className
      )}
    >
      {icon && (
        <div className={cn(
          'absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center',
          iconColor || 'bg-[#f0f2f7] text-[#7c8498]'
        )}>
          {icon}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[10px] sm:text-[11px] font-semibold text-[#9ba3b5] uppercase tracking-[0.08em] mb-1.5">{title}</p>
        <p className="text-2xl sm:text-[28px] font-bold font-num leading-none text-[#1a2138] tracking-tight">{value}</p>

        <div className="flex items-center gap-2 mt-2.5">
          {trend && (
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-num',
              trend.value >= 0
                ? 'bg-[#0d9b5c]/8 text-[#0d9b5c]'
                : 'bg-[#c53030]/8 text-[#c53030]'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(2)}%
            </span>
          )}

          {trend?.label && (
            <span className="text-[10px] text-[#9ba3b5]">{trend.label}</span>
          )}

          {subtitle && !trend && (
            <p className="text-[11px] text-[#9ba3b5] truncate">{subtitle}</p>
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
