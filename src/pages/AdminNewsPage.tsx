import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Mail, Check, Link as LinkIcon, RefreshCw, AlertCircle, Inbox, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface GmailConnection {
  user_id: string;
  email: string;
  expires_at: string;
  last_synced_at: string | null;
  scope: string;
  created_at: string;
  updated_at: string;
}

interface NewsItemRow {
  id: string;
  title: string;
  snippet: string | null;
  sender: string | null;
  source: string;
  category: string;
  link: string | null;
  published_at: string | null;
  gmail_message_id: string | null;
  created_at: string;
}

function useGmailConnection() {
  const { user } = useAuth();
  return useQuery<GmailConnection | null>({
    queryKey: ['gmail-connection', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gmail_connections')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as GmailConnection | null) ?? null;
    },
  });
}

function useIngestedNews() {
  return useQuery<NewsItemRow[]>({
    queryKey: ['news-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as NewsItemRow[];
    },
  });
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('No active session');
  return token;
}

export function AdminNewsPage() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const connection = useGmailConnection();
  const news = useIngestedNews();

  const [customQuery, setCustomQuery] = useState('');

  const connect = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      const res = await fetch('/api/gmail/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { url } = await res.json();
      return url as string;
    },
    onSuccess: url => { window.location.href = url; },
    onError: err => toast.error(`Could not start Gmail connect: ${(err as Error).message}`),
  });

  const syncNow = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      const res = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      return body as { scanned: number; inserted: number; query: string };
    },
    onSuccess: result => {
      toast.success(`Scanned ${result.scanned} messages, added ${result.inserted} new items`);
      qc.invalidateQueries({ queryKey: ['news-items'] });
      qc.invalidateQueries({ queryKey: ['gmail-connection'] });
      qc.invalidateQueries({ queryKey: ['marketNews'] });
    },
    onError: err => toast.error(`Sync failed: ${(err as Error).message}`),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('gmail_connections').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Gmail disconnected');
      qc.invalidateQueries({ queryKey: ['gmail-connection'] });
    },
    onError: err => toast.error(`Disconnect failed: ${(err as Error).message}`),
  });

  // Handle OAuth return — when Google redirects to /api/gmail/callback it
  // bounces here with ?code=…&state=…
  const oauthParams = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return { code: p.get('code'), state: p.get('state'), error: p.get('error') };
  }, [location.search]);

  const [exchanging, setExchanging] = useState(false);
  useEffect(() => {
    if (!oauthParams.code || !oauthParams.state) return;
    setExchanging(true);
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/gmail/exchange', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: oauthParams.code, state: oauthParams.state }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        toast.success(`Connected ${body.email || 'Gmail account'}`);
        qc.invalidateQueries({ queryKey: ['gmail-connection'] });
      } catch (err) {
        toast.error(`Gmail connect failed: ${(err as Error).message}`);
      } finally {
        setExchanging(false);
        navigate('/admin/news', { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthParams.code, oauthParams.state]);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const conn = connection.data;
  const lastSynced = conn?.last_synced_at ? new Date(conn.last_synced_at) : null;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin News</h1>
        <p className="text-sm text-muted mt-1">
          Connect a Gmail inbox to ingest financial news items into the public Market News feed.
        </p>
      </header>

      {oauthParams.error && (
        <Card className="!bg-danger/5 !border-danger/30">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger">Google returned an error</p>
              <p className="text-xs text-danger/80">{oauthParams.error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Connection card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
            <Mail size={20} className="text-info" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">Gmail connection</h2>
            {connection.isLoading ? (
              <p className="text-xs text-muted mt-1">Loading…</p>
            ) : conn ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-success" />
                  <span className="text-sm font-medium">{conn.email}</span>
                  <Badge status="active" label="Connected" />
                </div>
                <p className="text-xs text-muted">
                  Last synced: {lastSynced ? lastSynced.toLocaleString() : 'never'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted mt-1">Not connected yet.</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conn ? (
              <>
                <Button
                  onClick={() => syncNow.mutate()}
                  loading={syncNow.isPending}
                  icon={<RefreshCw size={14} />}
                >
                  Sync now
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => disconnect.mutate()}
                  loading={disconnect.isPending}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={() => connect.mutate()}
                loading={connect.isPending || exchanging}
                icon={<LinkIcon size={14} />}
              >
                Connect Gmail
              </Button>
            )}
          </div>
        </div>

        {conn && (
          <div className="mt-5 pt-5 border-t border-border">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Gmail search query (optional)
            </label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="newer_than:30d (subject:research OR from:@bsec.gov.bd)"
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              Uses Gmail's search syntax. Default: <code className="px-1 py-0.5 rounded bg-gray-100 text-[10px]">newer_than:30d (category:primary OR label:inbox)</code>
            </p>
          </div>
        )}
      </Card>

      {/* Ingested items */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Inbox size={18} className="text-muted" />
          <h2 className="font-semibold">Ingested news ({news.data?.length ?? 0})</h2>
        </div>
        {news.isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !news.data?.length ? (
          <p className="text-sm text-muted">
            No news items yet. Connect Gmail above and click "Sync now" to pull from your inbox.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {news.data.map(n => (
              <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {n.sender || '—'}
                      {n.published_at && (
                        <> · {new Date(n.published_at).toLocaleString()}</>
                      )}
                    </p>
                    {n.snippet && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{n.snippet}</p>
                    )}
                  </div>
                  {n.link && (
                    <a
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-info hover:text-info/80 shrink-0"
                      title="Open in Gmail"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
