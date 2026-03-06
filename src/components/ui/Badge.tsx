import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function Badge({ status, label, pulse, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusColor(status),
      className
    )}>
      {pulse && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full animate-pulse-dot',
          status === 'verified' || status === 'active' || status === 'executed' ? 'bg-success' :
          status === 'rejected' || status === 'failed' ? 'bg-danger' :
          status === 'pending' ? 'bg-warning' : 'bg-info'
        )} />
      )}
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}
