-- ═══════════════════════════════════════════
-- Visitor Tracking & Lead Capture Tables
-- ═══════════════════════════════════════════

-- Visitor events (page views, actions)
create table if not exists visitor_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  event_type text not null,
  page text,
  detail text,
  device text,
  created_at timestamptz not null default now()
);

create index if not exists idx_visitor_events_visitor on visitor_events(visitor_id);
create index if not exists idx_visitor_events_type on visitor_events(event_type);
create index if not exists idx_visitor_events_created on visitor_events(created_at);

-- Leads (captured contact info)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  name text,
  phone text,
  email text,
  source text not null default 'unknown',
  device text,
  visit_count int default 0,
  pages_viewed int default 0,
  lessons_completed int default 0,
  trades_placed int default 0,
  referrer text,
  first_visit timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created on leads(created_at);
create index if not exists idx_leads_phone on leads(phone);
create index if not exists idx_leads_email on leads(email);

-- Allow anonymous inserts (no auth required for tracking)
alter table visitor_events enable row level security;
create policy "Anyone can insert visitor events" on visitor_events for insert with check (true);
create policy "Admins can read visitor events" on visitor_events for select using (true);

alter table leads enable row level security;
create policy "Anyone can insert leads" on leads for insert with check (true);
create policy "Admins can read leads" on leads for select using (true);
