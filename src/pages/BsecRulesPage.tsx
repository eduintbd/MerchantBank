import { useState } from 'react';
import { bsecRules } from '@/data/bsec-rules';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BsecRulesPage() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  function toggleCategory(index: number) {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck size={28} className="text-info" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">BSEC Rules & Regulations</h1>
        </div>
        <p className="text-muted text-sm sm:text-base mt-1">
          Key regulatory frameworks governing Bangladesh's capital market
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {bsecRules.map((category, index) => (
          <Card key={index} padding={false}>
            <button
              onClick={() => toggleCategory(index)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-card-hover transition-colors rounded-2xl"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm sm:text-base text-foreground">{category.title}</h2>
                  <span className="shrink-0 text-[10px] font-medium text-muted bg-surface px-2 py-0.5 rounded-full">
                    {category.rules.length} rules
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted mt-1 line-clamp-1">{category.description}</p>
              </div>
              <div className="shrink-0 ml-3 text-muted">
                {expanded[index] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </button>

            {expanded[index] && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border">
                <ul className="mt-4 space-y-3">
                  {category.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start gap-3">
                      <span className={cn(
                        'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5',
                        'bg-info/10 text-info'
                      )}>
                        {ruleIndex + 1}
                      </span>
                      <p className="text-sm text-muted leading-relaxed">{rule}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>      </div>

    </div>
  );
}