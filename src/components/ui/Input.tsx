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
          <label className="block text-[11px] font-semibold text-[#7c8498] uppercase tracking-[0.06em]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ba3b5] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl border bg-white text-sm text-[#2d3348]',
              'placeholder:text-[#9ba3b5]/70',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/20 focus:border-[#c9a96e]/50 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)]',
              'hover:border-[#c9a96e]/30',
              icon ? 'pl-9 pr-3 py-2.5' : 'px-3.5 py-2.5',
              error ? 'border-[#c53030]/40 focus:ring-[#c53030]/20 focus:border-[#c53030]/50' : 'border-[#e1e5ee]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-[#c53030] font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
