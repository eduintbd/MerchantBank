import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';
import { cn } from '@/lib/utils';

export function DemoModeBanner() {
  const { isDemoMode } = useDemo();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoMode || dismissed) return null;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center gap-2 px-4 py-2',
        'bg-amber-50 border-b border-amber-200 text-amber-800',
        'text-xs sm:text-sm font-medium'
      )}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
      <span>
        Simulated trading only. No order will be sent to any exchange.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-amber-100 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5 text-amber-600" />
      </button>
    </div>
  );
}
