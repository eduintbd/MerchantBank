import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { X, ExternalLink, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CoachingEvent } from '@/types/demo';

interface CoachingCardProps {
  event: CoachingEvent;
  onDismiss: (id: string) => void;
}

const SEVERITY_CONFIG = {
  info: {
    borderColor: 'border-l-blue-500',
    icon: Info,
    iconColor: 'text-blue-600',
    bg: 'bg-blue-50/50',
  },
  warning: {
    borderColor: 'border-l-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50/50',
  },
  success: {
    borderColor: 'border-l-green-500',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bg: 'bg-green-50/50',
  },
};

export function CoachingCard({ event, onDismiss }: CoachingCardProps) {
  const config = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className={cn(
      'relative rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden transition-all duration-300',
      'border-l-4',
      config.borderColor
    )}>
      <div className={cn('px-4 py-3', config.bg)}>
        {/* Dismiss button */}
        <button
          onClick={() => onDismiss(event.id)}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className={cn('shrink-0 mt-0.5', config.iconColor)}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 leading-snug">{event.title}</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{event.message}</p>

            {event.lesson_id && event.lesson_title && (
              <Link
                to={`/learning?lesson=${event.lesson_id}`}
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#0b8a00] hover:underline"
              >
                <ExternalLink size={11} />
                Go to lesson: {event.lesson_title}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
