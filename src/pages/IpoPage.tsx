import { useState, useEffect } from 'react';
import { useIpos, useApplyIpo } from '@/hooks/useIpo';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Rocket, Calendar, Layers, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'upcoming' | 'open' | 'closed';

function Countdown({ targetDate }: { targetDate: string }) {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (days <= 0) return null;
  return (
    <span className="text-xs font-semibold text-warning">
      {days} day{days !== 1 ? 's' : ''} until open
    </span>
  );
}

function getStatusForTab(tab: TabType): string | undefined {
  if (tab === 'upcoming') return 'upcoming';
  if (tab === 'open') return 'open';
  if (tab === 'closed') return 'closed';
  return undefined;
}

export function IpoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const { data: ipos, isLoading } = useIpos(getStatusForTab(activeTab));
  const applyIpo = useApplyIpo();

  const handleApply = (ipo: any) => {
    applyIpo.mutate(
      { ipo_id: ipo.id, lots_applied: 1, amount: ipo.offer_price * ipo.lot_size },
      {
        onSuccess: () => toast.success(`Applied for ${ipo.company_name} IPO`),
        onError: (err: any) => toast.error(err.message || 'Failed to apply'),
      }
    );
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'open', label: 'Open' },
    { key: 'closed', label: 'Past' },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">IPO Center</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Browse and apply for upcoming IPOs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/5 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* IPO Cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted mt-3">Loading IPOs...</p>
        </div>
      ) : (ipos || []).length === 0 ? (
        <Card className="text-center py-12">
          <Rocket size={40} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No {activeTab} IPOs at the moment</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(ipos || []).map((ipo) => (
            <Card key={ipo.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{ipo.company_name}</h3>
                  {ipo.sector && <p className="text-xs text-muted mt-0.5">{ipo.sector}</p>}
                </div>
                <Badge status={ipo.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-muted shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Offer Price</p>
                    <p className="font-semibold font-num">{formatCurrency(ipo.offer_price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-muted shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Lot Size</p>
                    <p className="font-semibold font-num">{ipo.lot_size}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted">
                <Calendar size={14} className="shrink-0" />
                <span>{formatDate(ipo.subscription_start)} - {formatDate(ipo.subscription_end)}</span>
              </div>

              {activeTab === 'upcoming' && (
                <Countdown targetDate={ipo.subscription_start} />
              )}

              {activeTab === 'open' && (
                <Button
                  className="w-full"
                  onClick={() => handleApply(ipo)}
                  loading={applyIpo.isPending}
                >
                  Apply Now
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}      </div>

    </div>
  );
}