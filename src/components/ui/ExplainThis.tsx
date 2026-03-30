import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplainThisProps {
  title: string;
  explanation: string;
  lessonLink?: string;
}

export function ExplainThis({ title, explanation, lessonLink }: ExplainThisProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className={cn(
          'inline-flex items-center gap-1 text-[11px] font-medium',
          'text-blue-600 hover:text-blue-700 transition-colors',
          'focus:outline-none focus-visible:underline'
        )}
      >
        <BookOpen className="w-3 h-3" />
        <span>Explain this</span>
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-gray-700 leading-relaxed">
          <p className="font-semibold text-gray-900 mb-1">{title}</p>
          <p>{explanation}</p>
          {lessonLink && (
            <a
              href={lessonLink}
              className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Learn more
              <span aria-hidden="true">&rarr;</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
