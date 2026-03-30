import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { explainOrderStatus } from '@/services/orderSimulator';
import type { DemoOrder } from '@/types/demo';

interface OrderStatusExplainerProps {
  order: DemoOrder;
}

export function OrderStatusExplainer({ order }: OrderStatusExplainerProps) {
  const explanation = explainOrderStatus(order);

  const severityStyles: Record<string, string> = {
    filled: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    partially_filled: 'bg-blue-50 border-blue-200 text-blue-800',
    rejected: 'bg-red-50 border-red-200 text-red-800',
    cancelled: 'bg-gray-50 border-gray-200 text-gray-700',
    expired: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  const style = severityStyles[order.status] || 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className={cn('flex items-start gap-2 p-3 rounded-lg border text-xs leading-relaxed', style)}>
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
      <p>{explanation}</p>
    </div>
  );
}
