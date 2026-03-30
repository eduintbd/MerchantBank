import { useState, useRef, useEffect, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplainerTooltipProps {
  term: string;
  children: ReactNode;
}

export function ExplainerTooltip({ term, children }: ExplainerTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'inline-flex items-center justify-center w-4 h-4 rounded-full',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
        )}
        aria-label={`Explain: ${term}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'w-64 p-3 rounded-lg shadow-lg',
            'bg-white border border-gray-200',
            'text-xs text-gray-700 leading-relaxed',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <p className="font-semibold text-gray-900 mb-1">{term}</p>
          <div>{children}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2.5 h-2.5 bg-white border-r border-b border-gray-200 rotate-45 -translate-y-1/2" />
          </div>
        </div>
      )}
    </div>
  );
}
