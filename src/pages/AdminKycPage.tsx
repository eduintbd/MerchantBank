import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Profile, KycDocument, KycApproval } from '@/types';
import {
  ShieldCheck, Search, CheckCircle, XCircle, Clock, Eye, ChevronRight,
  UserCheck, UserX, AlertTriangle, Filter, Download, RotateCcw,
  FileText, Users, ShieldAlert, Activity,
} from 'lucide-react';

type FilterStatus = 'all' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'pending';

function useKycSubmissions() {
  return useQuery({
    queryKey: ['admin-kyc-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('kyc_status', ['submitted', 'under_review', 'verified', 'rejected', 'pending'])
        .neq('role', 'admin')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Profile[];
    },
    refetchInterval: 30000,
  });
}

function useKycDocuments(userId: string | null) {
  return useQuery({
    queryKey: ['kyc-documents', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data || []) as KycDocument[];
    },
    enabled: !!userId,
  });
}

function useKycHistory(userId: string | null) {
  return useQuery({
    queryKey: ['kyc-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('kyc_approvals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as KycApproval[];
    },
    enabled: !!userId,
  });
}

export function AdminKycPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: submissions = [], isLoading } = useKycSubmissions();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: docs = [] } = useKycDocuments(selectedUser?.id ?? null);
  const { data: history = [] } = useKycHistory(selectedUser?.id ?? null);

  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter(s => s.kyc_status === 'submitted' || s.kyc_status === 'under_review').length,
    verified: submissions.filter(s => s.kyc_status === 'verified').length,
    rejected: submissions.filter(s => s.kyc_status === 'rejected').length,
  }), [submissions]);

  const filtered = useMemo(() => {
    let result = [...submissions];
    if (filterStatus !== 'all') result = result.filter(s => s.kyc_status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.nid_number?.includes(q) ||
        s.bo_account?.includes(q) ||
        s.client_code?.includes(q)
      );
    }
    return result;
  }, [submissions, filterStatus, search]);

  const reviewMutation = useMutation({
    mutationFn: async ({ action, profile }: { action: 'approve' | 'reject' | 'return'; profile: Profile }) => {
      const statusMap = { approve: 'verified', reject: 'rejected', return: 'pending' } as const;
      const newStatus = statusMap[action];

      await supabase.from('profiles').update({
        kyc_status: newStatus,
        client_status: action === 'approve' ? 'active' : profile.client_status,
        kyc_verified_at: action === 'approve' ? new Date().toISOString() : null,
        kyc_verified_by: action === 'approve' ? user?.id : null,
      }).eq('id', profile.id);

      await supabase.from('kyc_approvals').insert({
        user_id: profile.id,
        action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned',
        status_from: profile.kyc_status,
        status_to: newStatus,
        reviewed_by: user?.id,
        reviewer_name: user?.full_name,
        reason: action === 'reject' ? rejectReason : undefined,
        notes: reviewNotes || undefined,
      });

      await supabase.from('client_activity_log').insert({
        user_id: profile.id,
        activity_type: `kyc_${action}`,
        description: `KYC ${action}d by ${user?.full_name}`,
        performed_by: user?.id,
        metadata: { reason: rejectReason || undefined, notes: reviewNotes || undefined },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-submissions'] });
      setSelectedUser(null);
      setReviewAction(null);
      setReviewNotes('');
      setRejectReason('');
    },
  });

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-3">
              <ShieldCheck size={28} className="text-primary" />
              KYC Management
            </h1>
            <p className="text-muted text-sm mt-1">Review and approve client KYC submissions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="Total Clients" value={stats.total} icon={<Users size={18} />} iconColor="bg-blue-50 text-blue-600" />
          <StatCard title="Pending Review" value={stats.pending} icon={<Clock size={18} />} iconColor="bg-amber-50 text-amber-600" />
          <StatCard title="Verified" value={stats.verified} icon={<UserCheck size={18} />} iconColor="bg-emerald-50 text-emerald-600" />
          <StatCard title="Rejected" value={stats.rejected} icon={<UserX size={18} />} iconColor="bg-red-50 text-red-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: List */}
          <div className="lg:col-span-1">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search name, NID, BO..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Status filter tabs */}
              <div className="flex flex-wrap gap-1 mb-4">
                {(['all', 'submitted', 'under_review', 'verified', 'rejected'] as FilterStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all capitalize',
                      filterStatus === s ? 'bg-primary text-white' : 'text-muted bg-surface hover:text-foreground'
                    )}
                  >
                    {s === 'all' ? `All (${stats.total})` : s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* Client list */}
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">No submissions found</p>
                ) : (
                  filtered.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedUser(profile)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl border transition-all',
                        selectedUser?.id === profile.id
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-transparent hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{profile.full_name || 'Unnamed'}</p>
                          <p className="text-[10px] text-muted truncate">{profile.email}</p>
                        </div>
                        <Badge status={profile.kyc_status} size="sm" />
                      </div>
                      {profile.nid_number && (
                        <p className="text-[10px] text-muted mt-1">NID: {profile.nid_number}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-2">
            {!selectedUser ? (
              <Card className="flex flex-col items-center justify-center h-[500px] text-center">
                <Eye size={40} className="text-muted/30 mb-3" />
                <p className="text-sm text-muted">Select a client from the list to review</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Client Summary */}
                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold">{selectedUser.full_name}</h2>
                      <p className="text-sm text-muted">{selectedUser.email} &middot; {selectedUser.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={selectedUser.kyc_status} size="md" pulse />
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/clients/${selectedUser.id}`)}>
                        Full Profile <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">NID</p>
                      <p className="font-semibold">{selectedUser.nid_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">TIN</p>
                      <p className="font-semibold">{selectedUser.tin_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">BO Account</p>
                      <p className="font-semibold">{selectedUser.bo_account || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Category</p>
                      <p className="font-semibold">{selectedUser.investor_category || 'RB'} / {selectedUser.account_type || 'Cash'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Father</p>
                      <p className="font-semibold">{selectedUser.father_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">DOB</p>
                      <p className="font-semibold">{selectedUser.date_of_birth || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Bank</p>
                      <p className="font-semibold">{selectedUser.bank_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Risk</p>
                      <p className="font-semibold capitalize">{selectedUser.risk_tolerance || '—'}</p>
                    </div>
                  </div>

                  {/* Compliance flags */}
                  {selectedUser.is_pep && (
                    <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-2">
                      <ShieldAlert size={16} className="text-warning" />
                      <span className="text-xs font-medium text-warning">PEP Flagged: {selectedUser.pep_details || 'No details provided'}</span>
                    </div>
                  )}
                </Card>

                {/* Documents */}
                <Card>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    Uploaded Documents ({docs.length})
                  </h3>
                  {docs.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">No documents uploaded</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {docs.map(doc => (
                        <div key={doc.id || doc.document_type} className="p-3 rounded-xl border border-border bg-surface text-center">
                          <FileText size={20} className="mx-auto mb-1.5 text-muted" />
                          <p className="text-[10px] font-semibold capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                          <Badge status={doc.status} size="sm" className="mt-1" />
                          {doc.file_size && <p className="text-[9px] text-muted mt-1">{(doc.file_size / 1024).toFixed(0)} KB</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Approval History */}
                {history.length > 0 && (
                  <Card>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Activity size={16} className="text-primary" />
                      Approval History
                    </h3>
                    <div className="space-y-2">
                      {history.map(h => (
                        <div key={h.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            h.action === 'approved' && 'bg-success/10 text-success',
                            h.action === 'rejected' && 'bg-danger/10 text-danger',
                            h.action === 'submitted' && 'bg-info/10 text-info',
                            h.action === 'returned' && 'bg-warning/10 text-warning',
                          )}>
                            {h.action === 'approved' ? <CheckCircle size={12} /> :
                             h.action === 'rejected' ? <XCircle size={12} /> :
                             h.action === 'submitted' ? <Clock size={12} /> :
                             <RotateCcw size={12} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold capitalize">{h.action}</p>
                            {h.reviewer_name && <p className="text-[10px] text-muted">by {h.reviewer_name}</p>}
                            {h.reason && <p className="text-[10px] text-danger mt-0.5">Reason: {h.reason}</p>}
                            {h.notes && <p className="text-[10px] text-muted mt-0.5">{h.notes}</p>}
                            <p className="text-[9px] text-muted/60 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                {(selectedUser.kyc_status === 'submitted' || selectedUser.kyc_status === 'under_review') && (
                  <Card>
                    <h3 className="text-sm font-semibold mb-4">Review Decision</h3>

                    {!reviewAction ? (
                      <div className="flex gap-3">
                        <Button variant="success" onClick={() => setReviewAction('approve')} icon={<CheckCircle size={16} />}>
                          Approve KYC
                        </Button>
                        <Button variant="danger" onClick={() => setReviewAction('reject')} icon={<XCircle size={16} />}>
                          Reject
                        </Button>
                        <Button variant="secondary" onClick={() => setReviewAction('return')} icon={<RotateCcw size={16} />}>
                          Return for Correction
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl border bg-surface">
                          <p className="text-xs font-semibold mb-1 capitalize">
                            Action: {reviewAction === 'approve' ? 'Approve' : reviewAction === 'reject' ? 'Reject' : 'Return for Correction'}
                          </p>
                        </div>

                        {reviewAction === 'reject' && (
                          <Input
                            label="Rejection Reason *"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Specify why KYC is being rejected"
                          />
                        )}

                        <Input
                          label="Notes (optional)"
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          placeholder="Internal notes for audit trail"
                        />

                        <div className="flex gap-3">
                          <Button
                            variant={reviewAction === 'approve' ? 'primary' : reviewAction === 'reject' ? 'danger' : 'secondary'}
                            loading={reviewMutation.isPending}
                            disabled={reviewAction === 'reject' && !rejectReason}
                            onClick={() => reviewMutation.mutate({ action: reviewAction, profile: selectedUser })}
                          >
                            Confirm {reviewAction === 'approve' ? 'Approval' : reviewAction === 'reject' ? 'Rejection' : 'Return'}
                          </Button>
                          <Button variant="ghost" onClick={() => { setReviewAction(null); setReviewNotes(''); setRejectReason(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
