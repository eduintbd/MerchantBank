import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MessageCircle, CheckCircle } from 'lucide-react';

interface ReflectionPromptProps {
  question: string;
  options: string[];
  onSubmit: (selectedIndex: number) => void;
}

export function ReflectionPrompt({ question, options, onSubmit }: ReflectionPromptProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    onSubmit(selected);
  }

  if (submitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Response recorded</p>
            <p className="text-xs text-gray-500 mt-0.5">Great job reflecting on your trading decision!</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#0b8a00]/10 flex items-center justify-center shrink-0">
          <MessageCircle size={20} className="text-[#0b8a00]" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Reflection</p>
          <h3 className="font-semibold text-sm text-gray-900 leading-snug">{question}</h3>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => setSelected(idx)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200',
              selected === idx
                ? 'border-[#0b8a00] bg-[#0b8a00]/5 ring-1 ring-[#0b8a00]/20'
                : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
              selected === idx ? 'border-[#0b8a00]' : 'border-gray-300'
            )}>
              {selected === idx && <div className="w-2.5 h-2.5 rounded-full bg-[#0b8a00]" />}
            </div>
            <span className={cn(
              'text-sm',
              selected === idx ? 'text-gray-900 font-medium' : 'text-gray-700'
            )}>
              {option}
            </span>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={selected === null}
        className="w-full"
      >
        Submit Response
      </Button>
    </Card>
  );
}
