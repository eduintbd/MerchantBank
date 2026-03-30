import { useEffect, useCallback, useRef } from 'react';
import { CoachingCard } from '@/components/coaching/CoachingCard';
import { useCoachingEvents, useDismissCoaching } from '@/hooks/useCoaching';

export function CoachingOverlay() {
  const { data: events } = useCoachingEvents();
  const dismissMutation = useDismissCoaching();
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const undismissed = (events || []).filter((e) => !e.is_dismissed).slice(0, 3);

  const handleDismiss = useCallback(
    (id: string) => {
      const timer = timerRefs.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timerRefs.current.delete(id);
      }
      dismissMutation.mutate(id);
    },
    [dismissMutation]
  );

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    for (const event of undismissed) {
      if (!timerRefs.current.has(event.id)) {
        const timer = setTimeout(() => {
          handleDismiss(event.id);
        }, 30000);
        timerRefs.current.set(event.id, timer);
      }
    }

    return () => {
      timerRefs.current.forEach((timer) => clearTimeout(timer));
    };
  }, [undismissed, handleDismiss]);

  if (undismissed.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-[360px] max-w-[calc(100vw-48px)]">
      {undismissed.map((event) => (
        <div
          key={event.id}
          className="animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <CoachingCard event={event} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>
  );
}
