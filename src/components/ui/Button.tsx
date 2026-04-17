import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

const variants = {
  primary: 'bg-gradient-to-r from-[#1a2744] to-[#2a3f6b] text-white shadow-sm shadow-[#1a2744]/15 hover:shadow-md hover:shadow-[#1a2744]/20 hover:brightness-110 active:brightness-95',
  secondary: 'bg-white border border-[#e1e5ee] text-[#2d3348] hover:bg-[#f0f2f7] hover:border-[#c9a96e]/30 shadow-[0_1px_2px_rgba(26,33,56,0.04)]',
  danger: 'bg-[#c53030]/8 text-[#c53030] border border-[#c53030]/15 hover:bg-[#c53030]/15',
  ghost: 'text-[#7c8498] hover:text-[#2d3348] hover:bg-[#f0f2f7]',
  success: 'bg-[#0d9b5c]/8 text-[#0d9b5c] border border-[#0d9b5c]/15 hover:bg-[#0d9b5c]/15',
  gold: 'bg-gradient-to-r from-[#c9a96e] to-[#dcc18e] text-[#1a2744] shadow-sm hover:shadow-md font-bold',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40 focus-visible:ring-offset-1',
        'hover:scale-[1.01] active:scale-[0.99]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
