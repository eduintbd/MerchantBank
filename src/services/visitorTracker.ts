import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════
// Visitor Tracking — identify and track users
// ═══════════════════════════════════════════

const VISITOR_KEY = 'herostock_visitor';
const EVENTS_KEY = 'herostock_events';
const LEAD_KEY = 'herostock_lead';

export interface VisitorProfile {
  id: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  totalPageViews: number;
  lessonsCompleted: number;
  tradesPlaced: number;
  eodRunsCompleted: number;
  device: string;
  referrer: string;
}

export interface VisitorEvent {
  type: string;
  page: string;
  detail?: string;
  timestamp: string;
}

export interface LeadInfo {
  name?: string;
  phone?: string;
  email?: string;
  capturedAt: string;
  source: string;
}

// ── Get or create visitor ──
export function getVisitor(): VisitorProfile {
  try {
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored) {
      const visitor = JSON.parse(stored) as VisitorProfile;
      visitor.lastVisit = new Date().toISOString();
      visitor.visitCount += 1;
      localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
      return visitor;
    }
  } catch {}

  const visitor: VisitorProfile = {
    id: 'v-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    visitCount: 1,
    totalPageViews: 0,
    lessonsCompleted: 0,
    tradesPlaced: 0,
    eodRunsCompleted: 0,
    device: getDeviceType(),
    referrer: document.referrer || 'direct',
  };

  localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
  return visitor;
}

// ── Track an event ──
export function trackEvent(type: string, detail?: string) {
  const event: VisitorEvent = {
    type,
    page: window.location.pathname,
    detail,
    timestamp: new Date().toISOString(),
  };

  // Store locally
  try {
    const events = getEvents();
    events.push(event);
    // Keep last 200 events
    const trimmed = events.slice(-200);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {}

  // Update visitor counters
  updateVisitorCounter(type);

  // Try to persist to Supabase (fire-and-forget)
  persistEventToSupabase(event).catch(() => {});
}

// ── Track page view ──
export function trackPageView(page: string) {
  trackEvent('page_view', page);
}

// ── Get all local events ──
export function getEvents(): VisitorEvent[] {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ── Save lead info ──
export function saveLead(info: Partial<LeadInfo>, source: string): LeadInfo {
  const lead: LeadInfo = {
    name: info.name,
    phone: info.phone,
    email: info.email,
    capturedAt: new Date().toISOString(),
    source,
  };
  localStorage.setItem(LEAD_KEY, JSON.stringify(lead));

  // Persist to Supabase
  persistLeadToSupabase(lead).catch(() => {});

  return lead;
}

// ── Check if lead already captured ──
export function getExistingLead(): LeadInfo | null {
  try {
    const stored = localStorage.getItem(LEAD_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// ── Should we show lead capture? ──
export function shouldShowLeadCapture(): boolean {
  // Don't show if already captured
  if (getExistingLead()) return false;

  const visitor = getVisitor();
  // Show after meaningful engagement
  return (
    visitor.lessonsCompleted >= 2 ||
    visitor.tradesPlaced >= 3 ||
    visitor.totalPageViews >= 10 ||
    visitor.visitCount >= 3
  );
}

// ── Helpers ──

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function updateVisitorCounter(eventType: string) {
  try {
    const visitor = JSON.parse(localStorage.getItem(VISITOR_KEY) || '{}') as VisitorProfile;
    if (eventType === 'page_view') visitor.totalPageViews = (visitor.totalPageViews || 0) + 1;
    if (eventType === 'lesson_completed') visitor.lessonsCompleted = (visitor.lessonsCompleted || 0) + 1;
    if (eventType === 'trade_placed') visitor.tradesPlaced = (visitor.tradesPlaced || 0) + 1;
    if (eventType === 'eod_completed') visitor.eodRunsCompleted = (visitor.eodRunsCompleted || 0) + 1;
    localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
  } catch {}
}

async function persistEventToSupabase(event: VisitorEvent) {
  try {
    const visitor = getVisitor();
    await supabase.from('visitor_events').insert({
      visitor_id: visitor.id,
      event_type: event.type,
      page: event.page,
      detail: event.detail || null,
      device: visitor.device,
      created_at: event.timestamp,
    });
  } catch {
    // Silently fail — localStorage is the primary store
  }
}

async function persistLeadToSupabase(lead: LeadInfo) {
  try {
    const visitor = getVisitor();
    await supabase.from('leads').insert({
      visitor_id: visitor.id,
      name: lead.name || null,
      phone: lead.phone || null,
      email: lead.email || null,
      source: lead.source,
      device: visitor.device,
      visit_count: visitor.visitCount,
      pages_viewed: visitor.totalPageViews,
      lessons_completed: visitor.lessonsCompleted,
      trades_placed: visitor.tradesPlaced,
      referrer: visitor.referrer,
      first_visit: visitor.firstVisit,
      created_at: lead.capturedAt,
    });
  } catch {
    // Silently fail
  }
}
