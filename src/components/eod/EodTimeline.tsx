import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useDemoEodRuns } from '@/hooks/useDemoEod';
import type { EodRun } from '@/types/demo';

interface EodTimelineProps {
  onSelectRun?: (run: EodRun) => void;
  selectedRunId?: string;
}

export function EodTimeline({ onSelectRun, selectedRunId }: EodTimelineProps) {
  const { data: runs, isLoading } = useDemoEodRuns();

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">Loading EOD history...</span>
        </div>
      </Card>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No EOD runs yet</p>
          <p className="text-xs text-gray-500 mt-1">Run your first end-of-day process to see history here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding={false} className="overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-900">EOD Processing History</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {runs.map((run) => (
          <button
            key={run.id}
            onClick={() => onSelectRun?.(run)}
            className={cn(
              'w-full flex items-center gap-4 px-5 sm:px-6 py-4 text-left transition-all duration-150 hover:bg-gray-50',
              selectedRunId === run.id && 'bg-[#0b8a00]/5 ring-1 ring-inset ring-[#0b8a00]/10'
            )}
          >
            <div className="flex flex-col items-center shrink-0">
              <div className={cn(
                'w-3 h-3 rounded-full',
                run.status === 'completed' ? 'bg-green-500' :
                run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                run.status === 'failed' ? 'bg-red-500' :
                'bg-gray-300'
              )} />
              <div className="w-px h-full bg-gray-200 mt-1" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-900">{formatDate(run.business_date)}</span>
                <Badge status={run.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {run.completed_at && (
                  <span>Completed at {new Date(run.completed_at).toLocaleTimeString()}</span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <TrendingUp size={14} className="text-gray-400 ml-auto" />
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
