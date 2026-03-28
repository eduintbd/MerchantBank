import { useState, useEffect } from 'react';
import { useNotificationPreferences, useUpdatePreferences } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bell, Mail, Smartphone, TrendingUp, ShoppingCart, Newspaper } from 'lucide-react';
import { toast } from 'sonner';

interface ToggleRowProps {
  icon: any;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          checked ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsPage() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdatePreferences();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);

  // Sync state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setEmailAlerts(preferences.email_alerts ?? true);
      setSmsAlerts(preferences.sms_alerts ?? false);
      setPriceAlerts(preferences.price_alerts ?? true);
      setOrderUpdates(preferences.order_updates ?? true);
      setNewsAlerts(preferences.news_alerts ?? true);
    }
  }, [preferences]);

  const handleSave = () => {
    updatePrefs.mutate(
      {
        email_alerts: emailAlerts,
        sms_alerts: smsAlerts,
        price_alerts: priceAlerts,
        order_updates: orderUpdates,
        news_alerts: newsAlerts,
      },
      {
        onSuccess: () => toast.success('Notification preferences saved'),
        onError: (err: any) => toast.error(err.message || 'Failed to save preferences'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-center py-12 animate-fade-in">
        <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted mt-3">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Manage how you receive alerts and updates</p>
      </div>

      <Card className="max-w-2xl">
        <ToggleRow
          icon={Mail}
          label="Email Alerts"
          description="Receive notifications via email"
          checked={emailAlerts}
          onChange={setEmailAlerts}
        />
        <ToggleRow
          icon={Smartphone}
          label="SMS Alerts"
          description="Receive notifications via SMS"
          checked={smsAlerts}
          onChange={setSmsAlerts}
        />
        <ToggleRow
          icon={TrendingUp}
          label="Price Alerts"
          description="Get notified when stocks hit target prices"
          checked={priceAlerts}
          onChange={setPriceAlerts}
        />
        <ToggleRow
          icon={ShoppingCart}
          label="Order Updates"
          description="Notifications about order status changes"
          checked={orderUpdates}
          onChange={setOrderUpdates}
        />
        <ToggleRow
          icon={Newspaper}
          label="News Alerts"
          description="Breaking news about your portfolio stocks"
          checked={newsAlerts}
          onChange={setNewsAlerts}
        />

        <div className="pt-4">
          <Button onClick={handleSave} loading={updatePrefs.isPending} className="w-full sm:w-auto">
            Save Preferences
          </Button>
        </div>
      </Card>      </div>

    </div>
  );
}