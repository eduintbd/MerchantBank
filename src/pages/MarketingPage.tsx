import { useReferrals, useCommissions, useMarketingSummary } from '@/hooks/useMarketing';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, DollarSign, Copy, Share2, UserPlus, Gift } from 'lucide-react';
import { useState } from 'react';

export function MarketingPage() {
  const { data: summary } = useMarketingSummary();
  const { data: referrals } = useReferrals();
  const { data: commissions } = useCommissions();
  const [copied, setCopied] = useState(false);

  const referralLink = summary?.referral_code
    ? `${window.location.origin}/register?ref=${summary.referral_code}`
    : '';

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Marketing & Referrals</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Refer friends and earn commission</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        <StatCard
          title="Total Referrals"
          value={summary?.total_referrals || 0}
          icon={<Users size={20} />}
          iconColor="bg-info/15 text-info"
          gradient="grad-info"
        />
        <StatCard
          title="Active Referrals"
          value={summary?.active_referrals || 0}
          icon={<UserPlus size={20} />}
          iconColor="bg-success/15 text-success"
          gradient="grad-success"
        />
        <StatCard
          title="Total Earned"
          value={formatCurrency(summary?.total_commission || 0)}
          icon={<DollarSign size={20} />}
          iconColor="bg-warning/15 text-warning"
          gradient="grad-warning"
        />
        <StatCard
          title="Pending"
          value={formatCurrency(summary?.pending_commission || 0)}
          icon={<Gift size={20} />}
          iconColor="bg-danger/15 text-danger"
          gradient="grad-danger"
        />
      </div>

      {/* Referral Link */}
      <div className="mt-6 sm:mt-8">
        <Card>
          <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Share2 size={18} className="text-info" />
            Your Referral Link
          </h2>
          <p className="text-sm text-muted mb-4">Share this link with friends. Earn 5% commission on their trading activity.</p>
          <div className="flex gap-3">
            <input
              readOnly
              value={referralLink || 'Loading...'}
              className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted font-num min-w-0"
            />
            <Button onClick={copyLink} icon={<Copy size={14} />} variant={copied ? 'success' : 'secondary'}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="mt-5 p-5 rounded-xl grad-info border border-info/10">
            <h4 className="text-sm font-medium text-info mb-2.5">Commission Structure</h4>
            <ul className="text-sm text-muted space-y-1.5">
              <li>Registration Bonus: BDT 100 per verified referral</li>
              <li>Trading Commission: 5% of brokerage fees</li>
              <li>Bonus: Additional rewards for top referrers</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Referrals Table */}
      <div className="mt-6 sm:mt-8">
        <Card padding={false}>
          <div className="px-5 sm:px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-base">Your Referrals</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border">
                  <th className="px-5 sm:px-6 py-3.5 font-medium">Name</th>
                  <th className="px-3 py-3.5 font-medium hidden sm:table-cell">Email</th>
                  <th className="px-3 py-3.5 font-medium">Status</th>
                  <th className="px-3 py-3.5 font-medium text-right">Commission</th>
                  <th className="px-5 sm:px-6 py-3.5 font-medium hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals?.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">No referrals yet. Share your link to get started!</td></tr>
                ) : (
                  referrals?.map(ref => (
                    <tr key={ref.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-5 sm:px-6 py-4 font-medium">{ref.referred_name}</td>
                      <td className="px-3 py-4 text-muted hidden sm:table-cell">{ref.referred_email}</td>
                      <td className="px-3 py-4"><Badge status={ref.status} /></td>
                      <td className="px-3 py-4 text-right font-medium font-num text-success">{formatCurrency(ref.commission_earned)}</td>
                      <td className="px-5 sm:px-6 py-4 text-muted hidden sm:table-cell">{formatDate(ref.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Commission History */}
      <div className="mt-6 sm:mt-8">
        <Card padding={false}>
          <div className="px-5 sm:px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-base">Commission History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border">
                  <th className="px-5 sm:px-6 py-3.5 font-medium">Type</th>
                  <th className="px-3 py-3.5 font-medium text-right">Amount</th>
                  <th className="px-3 py-3.5 font-medium">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-muted">No commission history</td></tr>
                ) : (
                  commissions?.map(comm => (
                    <tr key={comm.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-5 sm:px-6 py-4">
                        <Badge status={comm.type} label={comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} />
                      </td>
                      <td className="px-3 py-4 text-right font-medium font-num">{formatCurrency(comm.amount)}</td>
                      <td className="px-3 py-4"><Badge status={comm.status} /></td>
                      <td className="px-5 sm:px-6 py-4 text-muted">{formatDate(comm.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>      </div>

    </div>
  );
}