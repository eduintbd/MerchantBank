import { cn } from '@/lib/utils';
import type { Exchange } from '@/types';

type ExchangeFilter = 'ALL' | Exchange;

interface ExchangeToggleProps {
  value: ExchangeFilter;
  onChange: (value: ExchangeFilter) => void;
  size?: 'sm' | 'md';
}

export function ExchangeToggle({ value, onChange, size = 'md' }: ExchangeToggleProps) {
  const options: { key: ExchangeFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'DSE', label: 'DSE' },
    { key: 'CSE', label: 'CSE' },
  ];

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            'font-semibold rounded-md transition-all',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs',
            value === opt.key
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export type { ExchangeFilter };
