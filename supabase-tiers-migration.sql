-- Subscription tiers — Phase 1 of tiered trading product.
-- Each user has one active tier; gates which trading view they see.

alter table public.profiles
  add column if not exists subscription_tier text
    not null default 'starter'
    check (subscription_tier in ('starter', 'pro', 'elite'));

create index if not exists profiles_subscription_tier_idx
  on public.profiles (subscription_tier);

-- Admins/managers bypass the gate implicitly via AuthContext; no DB change needed.
