-- ============================================================
-- Abaci Investments Demo Trading + Learning Schema
-- ============================================================

-- ── Learner Profiles ──
create table if not exists learner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_level text not null default 'beginner' check (experience_level in ('beginner','intermediate','advanced')),
  risk_appetite text not null default 'moderate' check (risk_appetite in ('conservative','moderate','aggressive')),
  learning_goal text not null default '',
  preferred_language text not null default 'en' check (preferred_language in ('en','bn')),
  readiness_score numeric(5,2) not null default 0,
  confidence_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ── Demo Accounts ──
create table if not exists demo_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_code text unique not null,
  currency_code text not null default 'BDT',
  starting_cash numeric(18,2) not null default 100000,
  available_cash numeric(18,2) not null default 100000,
  buying_power numeric(18,2) not null default 100000,
  market_value numeric(18,2) not null default 0,
  unrealized_pnl numeric(18,2) not null default 0,
  realized_pnl numeric(18,2) not null default 0,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ── Demo Orders ──
create table if not exists demo_orders (
  id uuid primary key default gen_random_uuid(),
  demo_account_id uuid not null references demo_accounts(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('BUY','SELL')),
  order_type text not null check (order_type in ('MARKET','LIMIT')),
  quantity numeric(18,4) not null,
  limit_price numeric(18,4),
  filled_quantity numeric(18,4) not null default 0,
  avg_fill_price numeric(18,4) not null default 0,
  status text not null default 'draft',
  rejected_reason text,
  submitted_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Demo Trades ──
create table if not exists demo_trades (
  id uuid primary key default gen_random_uuid(),
  demo_order_id uuid not null references demo_orders(id),
  demo_account_id uuid not null references demo_accounts(id),
  symbol text not null,
  side text not null,
  quantity numeric(18,4) not null,
  price numeric(18,4) not null,
  gross_amount numeric(18,2) not null,
  total_charges numeric(18,2) not null default 0,
  net_amount numeric(18,2) not null,
  trade_time timestamptz not null default now()
);

-- ── Demo Positions ──
create table if not exists demo_positions (
  id uuid primary key default gen_random_uuid(),
  demo_account_id uuid not null references demo_accounts(id) on delete cascade,
  symbol text not null,
  quantity numeric(18,4) not null default 0,
  avg_cost numeric(18,4) not null default 0,
  market_price numeric(18,4) not null default 0,
  market_value numeric(18,2) not null default 0,
  unrealized_pnl numeric(18,2) not null default 0,
  realized_pnl numeric(18,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (demo_account_id, symbol)
);

-- ── Cash Ledger ──
create table if not exists demo_cash_ledger (
  id uuid primary key default gen_random_uuid(),
  demo_account_id uuid not null references demo_accounts(id) on delete cascade,
  entry_type text not null,
  reference_type text,
  reference_id uuid,
  debit numeric(18,2) not null default 0,
  credit numeric(18,2) not null default 0,
  balance_after numeric(18,2) not null,
  narration text,
  created_at timestamptz not null default now()
);

-- ── Fee Rules ──
create table if not exists fee_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_type text not null,
  rate_type text not null check (rate_type in ('percentage','flat')),
  rate_value numeric(18,6) not null,
  min_amount numeric(18,2) not null default 0,
  max_amount numeric(18,2) not null default 999999999,
  is_active boolean not null default true
);

-- ── Fee Charges ──
create table if not exists fee_charges (
  id uuid primary key default gen_random_uuid(),
  demo_trade_id uuid not null references demo_trades(id),
  fee_rule_id uuid not null references fee_rules(id),
  fee_name text not null,
  amount numeric(18,2) not null,
  created_at timestamptz not null default now()
);

-- ── EOD Runs ──
create table if not exists eod_runs (
  id uuid primary key default gen_random_uuid(),
  business_date date not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_date)
);

-- ── EOD Account Results ──
create table if not exists eod_account_results (
  id uuid primary key default gen_random_uuid(),
  eod_run_id uuid not null references eod_runs(id),
  demo_account_id uuid not null references demo_accounts(id),
  portfolio_value numeric(18,2) not null default 0,
  total_charges numeric(18,2) not null default 0,
  unrealized_pnl numeric(18,2) not null default 0,
  realized_pnl numeric(18,2) not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (eod_run_id, demo_account_id)
);

-- ── Statements ──
create table if not exists demo_statements (
  id uuid primary key default gen_random_uuid(),
  demo_account_id uuid not null references demo_accounts(id),
  eod_run_id uuid references eod_runs(id),
  business_date date not null,
  opening_cash numeric(18,2) not null default 0,
  closing_cash numeric(18,2) not null default 0,
  total_buys numeric(18,2) not null default 0,
  total_sells numeric(18,2) not null default 0,
  total_charges numeric(18,2) not null default 0,
  portfolio_value numeric(18,2) not null default 0,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── Lesson Tasks ──
create table if not exists lesson_tasks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  task_type text not null,
  description text not null,
  required_action text not null,
  sort_order int not null default 0
);

-- ── User Lesson Task Progress ──
create table if not exists user_lesson_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_task_id uuid not null references lesson_tasks(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, lesson_task_id)
);

-- ── Coaching Events ──
create table if not exists coaching_events (
  id uuid primary key default gen_random_uuid(),
  demo_account_id uuid not null references demo_accounts(id) on delete cascade,
  trigger_type text not null,
  title text not null default '',
  message text not null,
  severity text not null default 'info' check (severity in ('info','warning','success')),
  lesson_id uuid references lessons(id),
  lesson_title text,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Cohorts ──
create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ── Cohort Members ──
create table if not exists cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (cohort_id, user_id)
);

-- ── Contests ──
create table if not exists contests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  start_date timestamptz not null,
  end_date timestamptz not null,
  prize_description text,
  status text not null default 'upcoming' check (status in ('upcoming','active','completed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ── Indexes ──
create index if not exists idx_demo_orders_account on demo_orders(demo_account_id);
create index if not exists idx_demo_orders_status on demo_orders(status);
create index if not exists idx_demo_trades_account on demo_trades(demo_account_id);
create index if not exists idx_demo_positions_account on demo_positions(demo_account_id);
create index if not exists idx_demo_cash_ledger_account on demo_cash_ledger(demo_account_id);
create index if not exists idx_eod_account_results_run on eod_account_results(eod_run_id);
create index if not exists idx_coaching_events_account on coaching_events(demo_account_id);
create index if not exists idx_demo_statements_account on demo_statements(demo_account_id);

-- ── RLS Policies ──
alter table learner_profiles enable row level security;
alter table demo_accounts enable row level security;
alter table demo_orders enable row level security;
alter table demo_trades enable row level security;
alter table demo_positions enable row level security;
alter table demo_cash_ledger enable row level security;
alter table coaching_events enable row level security;
alter table demo_statements enable row level security;

-- Users see only their own data
create policy "Users read own learner profile" on learner_profiles for select using (auth.uid() = user_id);
create policy "Users insert own learner profile" on learner_profiles for insert with check (auth.uid() = user_id);
create policy "Users update own learner profile" on learner_profiles for update using (auth.uid() = user_id);

create policy "Users read own demo account" on demo_accounts for select using (auth.uid() = user_id);
create policy "Users insert own demo account" on demo_accounts for insert with check (auth.uid() = user_id);
create policy "Users update own demo account" on demo_accounts for update using (auth.uid() = user_id);

create policy "Users read own demo orders" on demo_orders for select
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));
create policy "Users insert own demo orders" on demo_orders for insert
  with check (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));
create policy "Users update own demo orders" on demo_orders for update
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));

create policy "Users read own demo trades" on demo_trades for select
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));
create policy "Users insert own demo trades" on demo_trades for insert
  with check (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));

create policy "Users read own positions" on demo_positions for select
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));
create policy "Users manage own positions" on demo_positions for all
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));

create policy "Users read own ledger" on demo_cash_ledger for select
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));
create policy "Users insert own ledger" on demo_cash_ledger for insert
  with check (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));

create policy "Users read own coaching" on coaching_events for select
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));
create policy "Users manage own coaching" on coaching_events for all
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));

create policy "Users read own statements" on demo_statements for select
  using (demo_account_id in (select id from demo_accounts where user_id = auth.uid()));

-- Fee rules & EOD runs are public read
alter table fee_rules enable row level security;
create policy "Anyone can read fee rules" on fee_rules for select using (true);

alter table eod_runs enable row level security;
create policy "Anyone can read eod runs" on eod_runs for select using (true);

-- ── Seed Fee Rules (Bangladesh Standard) ──
insert into fee_rules (name, fee_type, rate_type, rate_value, min_amount, max_amount) values
  ('Brokerage Commission', 'commission', 'percentage', 0.30, 25, 999999999),
  ('CDBL Fee', 'cdbl', 'percentage', 0.015, 2, 999999999),
  ('BSEC Fee', 'regulatory', 'percentage', 0.015, 1, 999999999),
  ('AIT (Advance Income Tax)', 'tax', 'percentage', 0.05, 0, 999999999)
on conflict do nothing;
