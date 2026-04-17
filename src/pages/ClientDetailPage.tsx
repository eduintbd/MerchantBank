import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { cn, formatCurrency } from '@/lib/utils';
import type { Profile, KycDocument, KycApproval, ClientActivityLog } from '@/types';
import {
  ArrowLeft, User, Wallet, BarChart3, FileText, ShieldCheck, Activity,
  TrendingUp, TrendingDown, Clock, Building2, CreditCard, Landmark,
  UserCheck, Phone, Mail, MapPin, Briefcase, ChevronRight,
} from 'lucide-react';

type TabId = 'summary' | 'holdings' | 'cash' | 'documents' | 'activity';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'summary', label: 'Summary', icon: User },
  { id: 'holdings', label: 'Holdings', icon: BarChart3 },
  { id: 'cash', label: 'Cash Ledger', icon: Wallet },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'activity', label: 'Activity Log', icon: Activity },
];

function useClientProfile(userId: string) {
  return useQuery({
    queryKey: ['client-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

function useClientDocuments(userId: string) {
  return useQuery({
    queryKey: ['client-documents', userId],
    queryFn: async () => {
      const { data } = await supabase.from('kyc_documents').select('*').eq('user_id', userId).order('uploaded_at', { ascending: false });
      return (data || []) as KycDocument[];
    },
  });
}

function useClientActivity(userId: string) {
  return useQuery({
    queryKey: ['client-activity', userId],
    queryFn: async () => {
      const { data } = await supabase.from('client_activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      return (data || []) as ClientActivityLog[];
    },
  });
}

function useClientOrders(userId: string) {
  return useQuery({
    queryKey: ['client-orders', userId],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
  });
}

function useClientPortfolio(userId: string) {
  return useQuery({
    queryKey: ['client-portfolio', userId],
    queryFn: async () => {
      const { data } = await supabase.from('portfolio').select('*').eq('user_id', userId);
      return data || [];
    },
  });
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: typeof User }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
      {Icon && <Icon size={14} className="text-muted shrink-0 mt-0.5" />}
      <div className="min-w-0">
        <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
      </div>
    </div>
  );
}

function SummaryTab({ profile }: { profile: Profile }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <User size={16} className="text-primary" /> Personal Information
        </h3>
        <InfoRow label="Full Name" value={profile.full_name} icon={User} />
        <InfoRow label="Father's Name" value={profile.father_name} />
        <InfoRow label="Mother's Name" value={profile.mother_name} />
        <InfoRow label="Date of Birth" value={profile.date_of_birth} />
        <InfoRow label="Gender" value={profile.gender} />
        <InfoRow label="Nationality" value={profile.nationality} icon={MapPin} />
        <InfoRow label="Marital Status" value={profile.marital_status} />
        <InfoRow label="Phone" value={profile.phone} icon={Phone} />
        <InfoRow label="Email" value={profile.email} icon={Mail} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CreditCard size={16} className="text-primary" /> Identity & Tax
        </h3>
        <InfoRow label="NID Number" value={profile.nid_number} icon={CreditCard} />
        <InfoRow label="NID Type" value={profile.nid_type} />
        <InfoRow label="TIN Number" value={profile.tin_number} />
        {profile.passport_number && <InfoRow label="Passport" value={profile.passport_number} />}
        <InfoRow label="BO Account" value={profile.bo_account} icon={Landmark} />
        <InfoRow label="BO Type" value={profile.bo_type} />
        <InfoRow label="CDBL DP ID" value={profile.cdbl_dp_id} />
        <InfoRow label="Client Code" value={profile.client_code} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Landmark size={16} className="text-primary" /> Bank Details
        </h3>
        <InfoRow label="Bank Name" value={profile.bank_name} icon={Building2} />
        <InfoRow label="Account Number" value={profile.bank_account} />
        <InfoRow label="Branch" value={profile.bank_branch} />
        <InfoRow label="Routing Number" value={profile.bank_routing_number} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Briefcase size={16} className="text-primary" /> Investment Profile
        </h3>
        <InfoRow label="Investor Category" value={profile.investor_category} />
        <InfoRow label="Account Type" value={profile.account_type} />
        <InfoRow label="Occupation" value={profile.occupation} icon={Briefcase} />
        <InfoRow label="Organization" value={profile.organization} />
        <InfoRow label="Annual Income" value={profile.annual_income} />
        <InfoRow label="Risk Tolerance" value={profile.risk_tolerance} />
        <InfoRow label="Investment Objective" value={profile.investment_objective} />
        <InfoRow label="Experience" value={profile.investment_experience} />
      </Card>

      {/* Nominee */}
      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <UserCheck size={16} className="text-primary" /> Nominee
        </h3>
        <InfoRow label="Name" value={profile.nominee_name} />
        <InfoRow label="Relation" value={profile.nominee_relation} />
        <InfoRow label="NID" value={profile.nominee_nid} />
        <InfoRow label="Phone" value={profile.nominee_phone} />
        <InfoRow label="Share" value={profile.nominee_share_pct ? `${profile.nominee_share_pct}%` : undefined} />
      </Card>

      {/* Address */}
      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-primary" /> Address
        </h3>
        <InfoRow label="Present Address" value={profile.present_address} />
        <InfoRow label="Permanent Address" value={profile.permanent_address} />
        <InfoRow label="City" value={profile.city} />
        <InfoRow label="District" value={profile.district} />
        <InfoRow label="Post Code" value={profile.post_code} />
      </Card>

      {/* Compliance */}
      <Card className="lg:col-span-2">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" /> Compliance & Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-muted uppercase">KYC Status</p>
            <Badge status={profile.kyc_status} size="md" pulse className="mt-1" />
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">Client Status</p>
            <Badge status={profile.client_status || 'pending_review'} size="md" className="mt-1" />
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">AML Risk</p>
            <Badge status={profile.aml_risk_level || 'low'} size="md" className="mt-1" />
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">PEP</p>
            <p className="text-sm font-medium mt-1">{profile.is_pep ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">KYC Verified At</p>
            <p className="text-xs font-medium mt-1">{profile.kyc_verified_at ? new Date(profile.kyc_verified_at).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">KYC Expiry</p>
            <p className="text-xs font-medium mt-1">{profile.kyc_expiry || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">Declaration</p>
            <p className="text-xs font-medium mt-1">{profile.declaration_signed ? 'Signed' : 'Not signed'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">Last KYC Update</p>
            <p className="text-xs font-medium mt-1">{profile.last_kyc_update ? new Date(profile.last_kyc_update).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function HoldingsTab({ userId }: { userId: string }) {
  const { data: holdings = [], isLoading } = useClientPortfolio(userId);

  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;

  const totalValue = holdings.reduce((s: number, h: any) => s + (h.current_value || 0), 0);
  const totalInvested = holdings.reduce((s: number, h: any) => s + (h.total_invested || 0), 0);
  const totalPL = totalValue - totalInvested;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard title="Total Value" value={formatCurrency(totalValue)} icon={<Wallet size={18} />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard title="Total Invested" value={formatCurrency(totalInvested)} icon={<TrendingUp size={18} />} iconColor="bg-purple-50 text-purple-600" />
        <StatCard title="Unrealized P&L" value={formatCurrency(totalPL)} icon={totalPL >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />} iconColor={totalPL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} />
      </div>

      <Card padding={false}>
        {holdings.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">No holdings found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Avg Cost</th>
                <th className="px-4 py-3 font-medium text-right">Current</th>
                <th className="px-4 py-3 font-medium text-right">Value</th>
                <th className="px-4 py-3 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h: any) => {
                const pl = (h.current_value || 0) - (h.total_invested || 0);
                const plPct = h.total_invested ? (pl / h.total_invested) * 100 : 0;
                return (
                  <tr key={h.id} className="border-t border-border/30 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold">{h.stock_symbol}</td>
                    <td className="px-4 py-2.5 text-right font-num">{h.quantity}</td>
                    <td className="px-4 py-2.5 text-right font-num">{formatCurrency(h.avg_buy_price)}</td>
                    <td className="px-4 py-2.5 text-right font-num">{formatCurrency(h.current_price)}</td>
                    <td className="px-4 py-2.5 text-right font-num">{formatCurrency(h.current_value)}</td>
                    <td className={cn('px-4 py-2.5 text-right font-num font-semibold', pl >= 0 ? 'text-success' : 'text-danger')}>
                      {pl >= 0 ? '+' : ''}{formatCurrency(pl)} ({plPct.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function CashLedgerTab({ userId }: { userId: string }) {
  const { data: orders = [], isLoading } = useClientOrders(userId);

  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;

  return (
    <Card padding={false}>
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold">Recent Orders & Transactions</h3>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">No transactions found</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-muted uppercase tracking-wider border-b border-border">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-t border-border/30 hover:bg-gray-50">
                <td className="px-4 py-2.5 text-xs text-muted font-num">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 font-semibold">{o.stock_symbol}</td>
                <td className="px-4 py-2.5">
                  <span className={cn('text-xs font-bold uppercase', o.order_type === 'buy' ? 'text-success' : 'text-danger')}>
                    {o.order_type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-num">{o.quantity}</td>
                <td className="px-4 py-2.5 text-right font-num">{formatCurrency(o.price)}</td>
                <td className="px-4 py-2.5 text-right font-num font-medium">{formatCurrency(o.total_amount)}</td>
                <td className="px-4 py-2.5"><Badge status={o.status} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function DocumentsTab({ userId }: { userId: string }) {
  const { data: docs = [], isLoading } = useClientDocuments(userId);

  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-4">KYC Documents</h3>
      {docs.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No documents uploaded</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {docs.map(doc => (
            <div key={doc.id || doc.document_type} className="p-4 rounded-xl border border-border bg-surface text-center">
              <FileText size={28} className="mx-auto mb-2 text-muted" />
              <p className="text-xs font-semibold capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
              <Badge status={doc.status} size="sm" className="mt-2" />
              {doc.file_size && <p className="text-[9px] text-muted mt-1">{(doc.file_size / 1024).toFixed(0)} KB</p>}
              <p className="text-[9px] text-muted mt-0.5">v{doc.version || 1}</p>
              <p className="text-[9px] text-muted">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityTab({ userId }: { userId: string }) {
  const { data: activities = [], isLoading } = useClientActivity(userId);

  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-4">Activity Log</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No activity recorded</p>
      ) : (
        <div className="space-y-1">
          {activities.map(a => (
            <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Activity size={14} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold capitalize">{a.activity_type.replace(/_/g, ' ')}</p>
                  <span className="text-[9px] text-muted font-num shrink-0">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                {a.description && <p className="text-[11px] text-muted mt-0.5">{a.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const { data: profile, isLoading, error } = useClientProfile(id!);

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-muted">Client not found</p>
    </div>
  );

  if (isLoading || !profile) return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="skeleton h-8 w-64 rounded-lg mb-4" />
        <div className="skeleton h-[600px] rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{profile.full_name}</h1>
              <Badge status={profile.kyc_status} size="md" pulse />
              <Badge status={profile.client_status || 'pending_review'} size="md" />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted mt-1">
              <span>{profile.email}</span>
              {profile.phone && <span>&middot; {profile.phone}</span>}
              {profile.client_code && <span>&middot; Code: {profile.client_code}</span>}
              {profile.investor_category && <span>&middot; {profile.investor_category} / {profile.account_type || 'Cash'}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
                  activeTab === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'
                )}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && <SummaryTab profile={profile} />}
        {activeTab === 'holdings' && <HoldingsTab userId={id!} />}
        {activeTab === 'cash' && <CashLedgerTab userId={id!} />}
        {activeTab === 'documents' && <DocumentsTab userId={id!} />}
        {activeTab === 'activity' && <ActivityTab userId={id!} />}
      </div>
    </div>
  );
}
