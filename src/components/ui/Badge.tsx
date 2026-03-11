import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  pulse?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ status, label, pulse, className, size = 'sm' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium backdrop-blur-sm',
      size === 'sm' && 'gap-1.5 px-2.5 py-0.5 text-xs',
      size === 'md' && 'gap-2 px-3 py-1 text-sm',
      getStatusColor(status),
      className
    )}>
      {pulse && (
        <span className={cn(
          'rounded-full animate-pulse-dot',
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          status === 'verified' || status === 'active' || status === 'executed' ? 'bg-success' :
          status === 'rejected' || status === 'failed' ? 'bg-danger' :
          status === 'pending' ? 'bg-warning' : 'bg-info'
        )} />
      )}
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}
