-- Gmail integration — Phase 1
-- Stores per-user OAuth tokens for the admin(s) connecting their news inbox,
-- plus the ingested news items and short-lived OAuth state nonces.

-- ─── gmail_connections ──────────────────────────────────────────────────────
-- One row per user who has connected a Google/Gmail account.
create table if not exists public.gmail_connections (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  access_token   text not null,
  refresh_token  text not null,
  expires_at     timestamptz not null,
  scope          text not null,
  last_synced_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.gmail_connections enable row level security;

drop policy if exists gmail_connections_self on public.gmail_connections;
create policy gmail_connections_self on public.gmail_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── gmail_oauth_states ─────────────────────────────────────────────────────
-- Short-lived nonces that tie an OAuth redirect back to the initiating user.
create table if not exists public.gmail_oauth_states (
  state      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.gmail_oauth_states enable row level security;

drop policy if exists gmail_oauth_states_self on public.gmail_oauth_states;
create policy gmail_oauth_states_self on public.gmail_oauth_states
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── news_items ─────────────────────────────────────────────────────────────
-- Ingested news (today from Gmail, later possibly other sources) shown in the
-- Market News feed merged with the RSS feeds.
create table if not exists public.news_items (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  snippet           text,
  sender            text,
  source            text not null default 'Email',
  category          text not null default 'capital',
  link              text,                       -- Gmail permalink (https://mail.google.com/mail/u/0/#inbox/<id>)
  published_at      timestamptz,
  gmail_message_id  text unique,                -- dedup key
  ingested_by       uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

alter table public.news_items enable row level security;

-- Everyone (even anon) can read news items.
drop policy if exists news_items_read on public.news_items;
create policy news_items_read on public.news_items
  for select using (true);

-- Admins/managers can insert/update/delete.
drop policy if exists news_items_write on public.news_items;
create policy news_items_write on public.news_items
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  ) with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

create index if not exists news_items_published_at_idx
  on public.news_items (published_at desc);
