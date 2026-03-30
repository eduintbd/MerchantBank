import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMistakeLog } from '@/hooks/useDemoReports';
import type { TradingMistake } from '@/types/demo';

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
};

export function MistakeLog() {
  const { data: mistakes, isLoading } = useMistakeLog();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading mistake log...</span>
      </div>
    );
  }

  if (!mistakes || mistakes.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} className="text-green-600" />
          </div>
          <p className="text-base font-semibold text-gray-900">No mistakes detected</p>
          <p className="text-sm text-gray-500 mt-1">Keep up the good work!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">
          {mistakes.length} issue{mistakes.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      {mistakes.map((mistake) => {
        const config = SEVERITY_CONFIG[mistake.severity] || SEVERITY_CONFIG.info;
        const Icon = config.icon;

        return (
          <Card
            key={mistake.id}
            className={cn('border-l-4', config.border, config.bg, '!border-t !border-r !border-b border-gray-200')}
            style={{ borderLeftColor: mistake.severity === 'warning' ? '#f59e0b' : mistake.severity === 'success' ? '#22c55e' : '#3b82f6' }}
          >
            <div className="flex items-start gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config.badge)}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-gray-900">{mistake.title}</h4>
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', config.badge)}>
                    {mistake.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{mistake.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-gray-400 font-num">
                    {new Date(mistake.detected_at).toLocaleDateString()}
                  </span>
                  {mistake.lesson_id && mistake.lesson_title && (
                    <Link
                      to={`/learning?lesson=${mistake.lesson_id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0b8a00] hover:underline"
                    >
                      <ExternalLink size={12} />
                      {mistake.lesson_title}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
