import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { ReconciliationRun, ReconciliationItem, BrokerExecution } from '@/types';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  ChevronDown,
  ChevronRight,
  FileCheck,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────

function matchStatusColor(status: string) {
  if (status === 'matched') return 'bg-success/15 text-success';
  if (status.includes('mismatch')) return 'bg-warning/15 text-warning';
  if (status.startsWith('missing')) return 'bg-danger/15 text-danger';
  return 'bg-gray-100 text-gray-600';
}

function statusBadgeVariant(status: string) {
  if (status === 'completed') return 'executed';
  if (status === 'running') return 'pending';
  if (status === 'failed') return 'rejected';
  return 'pending';
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// ── Data hooks ───────────────────────────────────────────────

function useReconRuns() {
  return useQuery<ReconciliationRun[]>({
    queryKey: ['reconciliation-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reconciliation_runs')
        .select('*')
        .order('recon_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });
}

function useReconItems(runId: string | null) {
  return useQuery<ReconciliationItem[]>({
    queryKey: ['reconciliation-items', runId],
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from('reconciliation_items')
        .select('*, profiles:client_id(full_name)')
        .eq('recon_run_id', runId)
        .order('match_status', { ascending: true });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        client_name: item.profiles?.full_name || item.client_code || '-',
      }));
    },
    enabled: !!runId,
  });
}

function usePendingExecutions() {
  return useQuery<BrokerExecution[]>({
    queryKey: ['pending-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_executions')
        .select('*')
        .eq('processing_status', 'received')
        .order('received_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15_000,
  });
}

function useRunReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('run-reconciliation');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Reconciliation triggered', { description: 'Run started. Refresh to see results.' });
      qc.invalidateQueries({ queryKey: ['reconciliation-runs'] });
    },
    onError: (err: any) => toast.error('Failed to trigger reconciliation', { description: err?.message }),
  });
}

function useResolveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('reconciliation_items')
        .update({ resolution_status: 'resolved', resolution_notes: notes, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item resolved');
      qc.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
    onError: (err: any) => toast.error('Failed', { description: err?.message }),
  });
}

function useProcessExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('broker_executions')
        .update({ processing_status: 'applied' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Execution processed');
      qc.invalidateQueries({ queryKey: ['pending-executions'] });
    },
    onError: (err: any) => toast.error('Failed', { description: err?.message }),
  });
}

// ── Page ─────────────────────────────────────────────────────

export function ReconciliationPage() {
  const [tab, setTab] = useState<'runs' | 'executions'>('runs');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const { data: runs, isLoading: loadingRuns } = useReconRuns();
  const { data: items, isLoading: loadingItems } = useReconItems(expandedRun);
  const { data: executions, isLoading: loadingExecs } = usePendingExecutions();
  const runRecon = useRunReconciliation();
  const resolveItem = useResolveItem();
  const processExec = useProcessExecution();

  // Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRun = (runs || []).find(r => r.recon_date === todayStr);
    const matched = todayRun?.matched ?? 0;
    const mismatched = (todayRun?.mismatched ?? 0) + (todayRun?.missing_abaci ?? 0) + (todayRun?.missing_broker ?? 0);
    return {
      todayStatus: todayRun?.status ?? 'not run',
      matched,
      discrepancies: mismatched,
      pendingExecs: executions?.length ?? 0,
    };
  }, [runs, executions]);

  function handleResolve(itemId: string) {
    if (!resolveNotes.trim()) {
      toast.error('Please add resolution notes');
      return;
    }
    resolveItem.mutate({ id: itemId, notes: resolveNotes.trim() }, {
      onSuccess: () => { setResolvingId(null); setResolveNotes(''); },
    });
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="space-y-6 sm:space-y-8 px-3 sm:px-6 lg:px-8 py-4 sm:py-6" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ========== HEADER ========== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Scale size={28} className="text-info" />
              Reconciliation
            </h1>
            <p className="text-muted text-sm mt-1.5">Daily position & trade reconciliation between Abaci and brokers</p>
          </div>
          <Button
            icon={<Play size={14} />}
            onClick={() => runRecon.mutate()}
            loading={runRecon.isPending}
          >
            Run Reconciliation
          </Button>
        </div>

        {/* ========== STATS GRID ========== */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Today's Recon"
            value={stats.todayStatus.replace(/_/g, ' ')}
            icon={<FileCheck size={18} />}
            iconColor={cn(
              'bg-info/15 text-info',
              stats.todayStatus === 'completed' && 'bg-success/15 text-success',
              stats.todayStatus === 'failed' && 'bg-danger/15 text-danger',
            )}
            gradient={stats.todayStatus === 'completed' ? 'grad-success' : undefined}
          />
          <StatCard
            title="Matched Items"
            value={stats.matched}
            icon={<CheckCircle2 size={18} />}
            iconColor="bg-success/15 text-success"
            gradient="grad-success"
          />
          <StatCard
            title="Discrepancies"
            value={stats.discrepancies}
            icon={<AlertTriangle size={18} />}
            iconColor="bg-warning/15 text-warning"
            gradient={stats.discrepancies > 0 ? 'grad-warning' : undefined}
          />
          <StatCard
            title="Pending Executions"
            value={stats.pendingExecs}
            icon={<Clock size={18} />}
            iconColor="bg-info/15 text-info"
            gradient={stats.pendingExecs > 0 ? 'grad-info' : undefined}
          />
        </div>

        {/* ========== TABS ========== */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-1 p-1 bg-surface rounded-xl">
              <button
                onClick={() => setTab('runs')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                  tab === 'runs' ? 'bg-info text-white shadow-sm' : 'text-muted hover:text-foreground'
                )}
              >
                <ArrowRightLeft size={14} />
                Recon Runs
              </button>
              <button
                onClick={() => setTab('executions')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                  tab === 'executions' ? 'bg-warning text-white shadow-sm' : 'text-muted hover:text-foreground'
                )}
              >
                <Clock size={14} />
                Pending Executions ({stats.pendingExecs})
              </button>
            </div>
          </div>

          {/* ── Recon Runs Tab ── */}
          {tab === 'runs' && (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] text-muted uppercase tracking-wider border-b border-border bg-gray-50/80">
                      <th className="px-4 py-3 font-medium w-8" />
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium text-right">Matched</th>
                      <th className="px-3 py-3 font-medium text-right">Mismatched</th>
                      <th className="px-3 py-3 font-medium text-right">Missing</th>
                      <th className="px-3 py-3 font-medium text-right">Discrepancy</th>
                      <th className="px-3 py-3 font-medium text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRuns ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-10 text-center text-muted">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={20} className="animate-spin text-info" />
                            <span className="text-xs">Loading runs...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !runs?.length ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-10 text-center text-muted text-xs">
                          No reconciliation runs yet
                        </td>
                      </tr>
                    ) : (
                      runs.map(run => (
                        <RunRow
                          key={run.id}
                          run={run}
                          isExpanded={expandedRun === run.id}
                          onToggle={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                          items={expandedRun === run.id ? items : undefined}
                          loadingItems={loadingItems}
                          resolvingId={resolvingId}
                          resolveNotes={resolveNotes}
                          onSetResolvingId={setResolvingId}
                          onSetResolveNotes={setResolveNotes}
                          onResolve={handleResolve}
                          resolving={resolveItem.isPending}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Pending Executions Tab ── */}
          {tab === 'executions' && (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] text-muted uppercase tracking-wider border-b border-border bg-gray-50/80">
                      <th className="px-4 py-3 font-medium">Received</th>
                      <th className="px-3 py-3 font-medium">Exec ID</th>
                      <th className="px-3 py-3 font-medium">Client</th>
                      <th className="px-3 py-3 font-medium">Symbol</th>
                      <th className="px-3 py-3 font-medium">Side</th>
                      <th className="px-3 py-3 font-medium text-right">Qty</th>
                      <th className="px-3 py-3 font-medium text-right">Price</th>
                      <th className="px-3 py-3 font-medium text-right">Net Value</th>
                      <th className="px-3 py-3 font-medium">Source</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingExecs ? (
                      <tr>
                        <td colSpan={11} className="px-5 py-10 text-center text-muted">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={20} className="animate-spin text-info" />
                            <span className="text-xs">Loading executions...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !executions?.length ? (
                      <tr>
                        <td colSpan={11} className="px-5 py-10 text-center text-muted text-xs">
                          No pending executions
                        </td>
                      </tr>
                    ) : (
                      executions.map(exec => (
                        <tr key={exec.id} className="border-b border-border/30 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-[10px] text-muted">{formatDateTime(exec.received_at)}</td>
                          <td className="px-3 py-3 font-num font-medium text-foreground truncate max-w-[100px]">{exec.exec_id}</td>
                          <td className="px-3 py-3 font-medium text-foreground">{exec.client_code}</td>
                          <td className="px-3 py-3 font-semibold text-foreground">{exec.symbol}</td>
                          <td className="px-3 py-3">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold',
                              exec.side === 'BUY' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                            )}>
                              {exec.side === 'BUY' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              {exec.side}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-num font-medium text-foreground">{exec.exec_qty.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right font-num text-foreground">{formatCurrency(exec.exec_price)}</td>
                          <td className="px-3 py-3 text-right font-num font-bold text-foreground">{formatCurrency(exec.net_value)}</td>
                          <td className="px-3 py-3">
                            <span className="text-[10px] text-muted uppercase">{exec.source}</span>
                          </td>
                          <td className="px-3 py-3"><Badge status={exec.processing_status} /></td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => processExec.mutate(exec.id)}
                              loading={processExec.isPending}
                              icon={<CheckCircle2 size={12} />}
                            >
                              Process
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Run Row with expandable items ────────────────────────────

interface RunRowProps {
  run: ReconciliationRun;
  isExpanded: boolean;
  onToggle: () => void;
  items?: ReconciliationItem[];
  loadingItems: boolean;
  resolvingId: string | null;
  resolveNotes: string;
  onSetResolvingId: (id: string | null) => void;
  onSetResolveNotes: (v: string) => void;
  onResolve: (id: string) => void;
  resolving: boolean;
}

function RunRow({ run, isExpanded, onToggle, items, loadingItems, resolvingId, resolveNotes, onSetResolvingId, onSetResolveNotes, onResolve, resolving }: RunRowProps) {
  const missingTotal = (run.missing_abaci || 0) + (run.missing_broker || 0);

  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          'border-b border-border/30 hover:bg-gray-50/50 transition-colors cursor-pointer',
          isExpanded && 'bg-info/[0.03]'
        )}
      >
        <td className="px-4 py-3 text-muted">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td className="px-3 py-3 font-num font-medium text-foreground">{run.recon_date}</td>
        <td className="px-3 py-3">
          <span className="capitalize text-foreground">{run.recon_type}</span>
        </td>
        <td className="px-3 py-3"><Badge status={statusBadgeVariant(run.status)} label={run.status} /></td>
        <td className="px-3 py-3 text-right font-num font-bold text-success">{run.matched}</td>
        <td className="px-3 py-3 text-right font-num font-bold text-warning">{run.mismatched}</td>
        <td className="px-3 py-3 text-right font-num font-bold text-danger">{missingTotal}</td>
        <td className="px-3 py-3 text-right font-num font-bold text-foreground">
          {run.total_discrepancy_value ? formatCurrency(run.total_discrepancy_value) : '-'}
        </td>
        <td className="px-3 py-3 text-right font-num text-muted">{formatDuration(run.duration_seconds)}</td>
      </tr>

      {/* Expanded items */}
      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-gray-50/60 border-y border-border/40">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] text-muted uppercase tracking-wider border-b border-border/40">
                      <th className="px-5 py-2.5 font-medium">Client</th>
                      <th className="px-3 py-2.5 font-medium">Symbol</th>
                      <th className="px-3 py-2.5 font-medium">Match</th>
                      <th className="px-3 py-2.5 font-medium text-right">Abaci Qty</th>
                      <th className="px-3 py-2.5 font-medium text-right">Abaci Value</th>
                      <th className="px-3 py-2.5 font-medium text-right">Broker Qty</th>
                      <th className="px-3 py-2.5 font-medium text-right">Broker Value</th>
                      <th className="px-3 py-2.5 font-medium text-right">Qty Diff</th>
                      <th className="px-3 py-2.5 font-medium text-right">Value Diff</th>
                      <th className="px-3 py-2.5 font-medium">Resolution</th>
                      <th className="px-4 py-2.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingItems ? (
                      <tr>
                        <td colSpan={11} className="px-5 py-6 text-center text-muted">
                          <Loader2 size={16} className="inline animate-spin text-info mr-2" />
                          Loading items...
                        </td>
                      </tr>
                    ) : !items?.length ? (
                      <tr>
                        <td colSpan={11} className="px-5 py-6 text-center text-muted text-xs">No items</td>
                      </tr>
                    ) : (
                      items.map(item => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          isResolving={resolvingId === item.id}
                          resolveNotes={resolveNotes}
                          onStartResolve={() => { onSetResolvingId(item.id); onSetResolveNotes(''); }}
                          onCancelResolve={() => onSetResolvingId(null)}
                          onSetNotes={onSetResolveNotes}
                          onResolve={() => onResolve(item.id)}
                          resolving={resolving}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Item Row ─────────────────────────────────────────────────

interface ItemRowProps {
  item: ReconciliationItem;
  isResolving: boolean;
  resolveNotes: string;
  onStartResolve: () => void;
  onCancelResolve: () => void;
  onSetNotes: (v: string) => void;
  onResolve: () => void;
  resolving: boolean;
}

function ItemRow({ item, isResolving, resolveNotes, onStartResolve, onCancelResolve, onSetNotes, onResolve, resolving }: ItemRowProps) {
  return (
    <>
      <tr className="border-b border-border/20 last:border-0 hover:bg-white/60 transition-colors">
        <td className="px-5 py-2.5">
          <div className="font-medium text-foreground text-[11px]">{item.client_name || item.client_code || '-'}</div>
          {item.client_code && item.client_name && item.client_name !== item.client_code && (
            <div className="text-[10px] text-muted">{item.client_code}</div>
          )}
        </td>
        <td className="px-3 py-2.5 font-semibold text-foreground">{item.symbol || '-'}</td>
        <td className="px-3 py-2.5">
          <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-bold', matchStatusColor(item.match_status))}>
            {item.match_status.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right font-num text-foreground">{item.abaci_qty?.toLocaleString() ?? '-'}</td>
        <td className="px-3 py-2.5 text-right font-num text-foreground">{item.abaci_value != null ? formatCurrency(item.abaci_value) : '-'}</td>
        <td className="px-3 py-2.5 text-right font-num text-foreground">{item.broker_qty?.toLocaleString() ?? '-'}</td>
        <td className="px-3 py-2.5 text-right font-num text-foreground">{item.broker_value != null ? formatCurrency(item.broker_value) : '-'}</td>
        <td className={cn('px-3 py-2.5 text-right font-num font-bold', item.qty_diff !== 0 ? 'text-danger' : 'text-muted')}>
          {item.qty_diff !== 0 ? item.qty_diff.toLocaleString() : '-'}
        </td>
        <td className={cn('px-3 py-2.5 text-right font-num font-bold', item.value_diff !== 0 ? 'text-danger' : 'text-muted')}>
          {item.value_diff !== 0 ? formatCurrency(item.value_diff) : '-'}
        </td>
        <td className="px-3 py-2.5"><Badge status={item.resolution_status} /></td>
        <td className="px-4 py-2.5 text-right">
          {item.resolution_status === 'open' && !isResolving && (
            <Button size="sm" variant="ghost" onClick={onStartResolve} icon={<MessageSquare size={12} />}>
              Resolve
            </Button>
          )}
        </td>
      </tr>

      {/* Inline resolve form */}
      {isResolving && (
        <tr className="bg-info/[0.04]">
          <td colSpan={11} className="px-5 py-3">
            <div className="flex items-center gap-3 max-w-xl">
              <div className="flex-1">
                <Input
                  placeholder="Resolution notes..."
                  value={resolveNotes}
                  onChange={e => onSetNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
              <Button size="sm" variant="success" onClick={onResolve} loading={resolving} icon={<CheckCircle2 size={12} />}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelResolve}>
                Cancel
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
