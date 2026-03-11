import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  rating: string;
  label: string;
}

const ratingColors: Record<string, string> = {
  A: 'bg-success/15 text-success border border-success/20',
  B: 'bg-info/15 text-info border border-info/20',
  C: 'bg-warning/15 text-warning border border-warning/20',
};

export function EsgBadge({ rating, label }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
        ratingColors[rating] || 'bg-white/5 text-muted border border-border'
      )}
    >
      <Leaf size={12} />
      {label}
    </span>
  );
}
