import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

const variants = {
  primary: 'bg-[#00b386] text-white shadow-sm shadow-[#00b386]/15 hover:bg-[#00a87d] hover:shadow-md active:bg-[#009973]',
  secondary: 'bg-white border border-[#e9e9eb] text-[#44475b] hover:bg-[#f8f8f8] hover:border-[#c7c8ce] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  danger: 'bg-[#eb5b3c]/8 text-[#eb5b3c] border border-[#eb5b3c]/15 hover:bg-[#eb5b3c]/15',
  ghost: 'text-[#7c7e8c] hover:text-[#44475b] hover:bg-[#f8f8f8]',
  success: 'bg-[#00b386]/8 text-[#00b386] border border-[#00b386]/15 hover:bg-[#00b386]/15',
  gold: 'bg-[#00b386] text-white shadow-sm hover:bg-[#00a87d] hover:shadow-md font-bold',
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
        'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b386]/40 focus-visible:ring-offset-1',
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
