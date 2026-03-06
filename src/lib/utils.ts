import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-danger';
  return 'text-muted';
}

export function getChangeBg(value: number): string {
  if (value > 0) return 'bg-success-dim';
  if (value < 0) return 'bg-danger-dim';
  return 'bg-white/5';
}

export function formatVolume(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString();
}

export function formatValueBn(n: number): string {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-warning-dim text-warning border border-warning/20',
    submitted: 'bg-info-dim text-info border border-info/20',
    verified: 'bg-success-dim text-success border border-success/20',
    rejected: 'bg-danger-dim text-danger border border-danger/20',
    executed: 'bg-success-dim text-success border border-success/20',
    cancelled: 'bg-white/5 text-muted border border-border',
    active: 'bg-success-dim text-success border border-success/20',
    completed: 'bg-success-dim text-success border border-success/20',
    in_progress: 'bg-info-dim text-info border border-info/20',
    passed: 'bg-success-dim text-success border border-success/20',
    failed: 'bg-danger-dim text-danger border border-danger/20',
    paid: 'bg-success-dim text-success border border-success/20',
  };
  return colors[status] || 'bg-white/5 text-muted border border-border';
}
