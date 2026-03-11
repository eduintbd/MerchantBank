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
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg border bg-background text-sm text-foreground',
              'placeholder:text-muted-foreground/70',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:shadow-[var(--shadow-glow)]',
              'hover:border-border-light',
              icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
              error ? 'border-danger/50 focus:ring-danger/20 focus:border-danger/40' : 'border-border',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-danger font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
