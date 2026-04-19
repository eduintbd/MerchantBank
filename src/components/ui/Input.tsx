import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[11px] font-medium text-[#7c7e8c] uppercase tracking-[0.06em]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a3ad] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg border bg-white text-sm text-[#44475b]',
              'placeholder:text-[#a1a3ad]/70',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#00b386]/20 focus:border-[#00b386]/50 focus:shadow-[0_0_0_3px_rgba(0,179,134,0.08)]',
              'hover:border-[#c7c8ce]',
              icon ? 'pl-9 pr-3 py-2.5' : 'px-3.5 py-2.5',
              error ? 'border-[#eb5b3c]/40 focus:ring-[#eb5b3c]/20 focus:border-[#eb5b3c]/50' : 'border-[#e9e9eb]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-[#eb5b3c] font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
