# HeroStock.ai Demo Trading + Learning — Implementation Tasks

> Generated from PRD: `herostock-demo-learning-prd.pdf`
> Baseline: Current `hero-frontend` codebase as of 2026-03-30

---

## Gap Analysis Summary

| PRD Module | Current Status | Work Needed |
|---|---|---|
| Auth & Mode Selection | Auth exists (email/password) | Add demo/live mode toggle, environment banner |
| Learner Onboarding | Basic signup only | New onboarding flow (experience, risk, language, goals) |
| Dashboard | Exists with market widgets | Add demo-specific widgets (virtual cash, learning tasks, EOD status) |
| Market Watch | Exists (stocks, sectors, gainers/losers) | Add lesson-linked watchlist prompts |
| Order Simulator | Real orders only, admin-executed | **New**: Full simulation engine with fill rules, lifecycle states |
| Portfolio | Exists (holdings, P&L) | Adapt for demo positions, add charges impact, sector exposure |
| Ledger & Balances | **Missing** | **New**: Full cash ledger module |
| Charges Simulator | **Missing** | **New**: Fee rules engine + pre/post trade display |
| EOD Replay Engine | **Missing** | **New**: Batch processing + replay UI (highest differentiator) |
| Reports & Statements | **Missing** | **New**: Daily activity, trade history, P&L, EOD statements |
| Learning Engine | Partially exists (courses, lessons, quizzes) | Link lessons to trading actions, add scenario missions |
| Coaching Layer | **Missing** | **New**: Contextual coaching triggers + inline hints |
| Admin/Mentor Console | Partial (admin orders) | Add cohorts, contests, account resets, conversion tracking |
| Database Schema | Core tables exist | **New**: 15+ demo-specific tables |

---

## Epic 1: Database Schema & Backend Foundation

### 1.1 — Create demo account tables
- **Priority**: P0 (blocker for all demo features)
- **Description**: Add Supabase migration for `demo_accounts`, `demo_cash_ledger` tables per PRD schema (Section 16)
- **Tables**: `demo_accounts` (id, user_id, account_code, currency_code, starting_cash, available_cash, buying_power, market_value, unrealized_pnl, realized_pnl, status, timestamps)
- **RLS**: Users can only read/write their own demo accounts
- **Files to create**: `supabase/migrations/demo-accounts.sql`

### 1.2 — Create demo order & trade tables
- **Priority**: P0
- **Description**: Add `demo_orders`, `demo_trades` tables with full order lifecycle support
- **Tables**: `demo_orders` (id, demo_account_id, symbol, side, order_type, quantity, limit_price, status, submitted_at, executed_at, rejected_reason), `demo_trades` (id, demo_order_id, demo_account_id, symbol, side, quantity, price, gross_amount, total_charges, net_amount, trade_time)
- **Constraints**: side IN ('BUY','SELL'), order_type IN ('MARKET','LIMIT')
- **Files to create**: `supabase/migrations/demo-orders-trades.sql`

### 1.3 — Create demo positions & fee tables
- **Priority**: P0
- **Description**: Add `demo_positions`, `position_lots`, `fee_rules`, `fee_charges` tables
- **Tables**: `demo_positions` (id, demo_account_id, symbol, quantity, avg_cost, market_price, market_value, unrealized_pnl, realized_pnl), unique on (demo_account_id, symbol)
- **Seed data**: Default Bangladeshi brokerage fee rules (commission %, CDBL fees, etc.)
- **Files to create**: `supabase/migrations/demo-positions-fees.sql`

### 1.4 — Create EOD processing tables
- **Priority**: P0
- **Description**: Add `eod_runs`, `eod_account_results`, `statements` tables
- **Tables**: Per PRD Section 16 schema
- **Files to create**: `supabase/migrations/demo-eod.sql`

### 1.5 — Create learning linkage tables
- **Priority**: P1
- **Description**: Add `lesson_tasks`, `user_lesson_progress` (action-mapped), `coaching_events` tables
- **Purpose**: Map trading actions to learning objectives
- **Files to create**: `supabase/migrations/demo-learning-linkage.sql`

### 1.6 — Create cohort & contest tables
- **Priority**: P2
- **Description**: Add `cohorts`, `cohort_members`, `contests` tables for admin/mentor features
- **Files to create**: `supabase/migrations/demo-cohorts-contests.sql`

### 1.7 — Add RLS policies for all demo tables
- **Priority**: P0
- **Description**: Row-Level Security policies ensuring demo data isolation per user. Admin bypass for mentor console.
- **Files to modify**: All migration files above

---

## Epic 2: Auth & Demo Mode Selection

### 2.1 — Add demo/live mode toggle to auth flow
- **Priority**: P0
- **Description**: After login, user selects "Demo / Learn" or "Live" mode. Persist selection in session. Demo mode creates/loads a `demo_account` automatically.
- **Files to modify**: `src/pages/AuthPage.tsx`, `src/contexts/AuthContext.tsx`
- **New files**: `src/components/auth/ModeSelector.tsx`

### 2.2 — Add persistent demo-mode environment banner
- **Priority**: P0
- **Description**: Display a clear banner across all pages: "Simulated trading only. No order will be sent to any exchange." when in demo mode. Must be visually distinct (e.g., amber/yellow bar).
- **Files to modify**: `src/components/layout/AppLayout.tsx`
- **New files**: `src/components/layout/DemoModeBanner.tsx`

### 2.3 — Create DemoContext provider
- **Priority**: P0
- **Description**: React context to manage demo mode state: `isDemoMode`, `demoAccount`, `switchMode()`. Wraps the app alongside AuthProvider.
- **New files**: `src/contexts/DemoContext.tsx`
- **Files to modify**: `src/App.tsx`

---

## Epic 3: Learner Onboarding

### 3.1 — Build learner onboarding wizard
- **Priority**: P1
- **Description**: Multi-step form after first demo login: full name, mobile/email (prefilled), preferred language (Bangla/English), investor experience level, risk appetite, learning goal.
- **New files**: `src/pages/OnboardingPage.tsx`, `src/components/onboarding/OnboardingWizard.tsx`
- **Files to modify**: `src/App.tsx` (add route)

### 3.2 — Create learner profile record
- **Priority**: P1
- **Description**: On onboarding completion: create `learner_profiles` record, create `demo_account` with virtual BDT balance (e.g., 100,000 BDT), enroll in starter learning journey.
- **New hook**: `src/hooks/useLearnerOnboarding.ts`
- **DB**: Insert into `demo_accounts` + `learner_profiles`

### 3.3 — Add virtual cash funding
- **Priority**: P1
- **Description**: System auto-funds new demo accounts with configurable starting BDT. Record in `demo_cash_ledger` as initial credit.
- **Files to modify**: `src/hooks/useLearnerOnboarding.ts`

---

## Epic 4: Demo Dashboard

### 4.1 — Create demo dashboard variant
- **Priority**: P0
- **Description**: When in demo mode, Dashboard shows demo-specific widgets: virtual cash balance, buying power, total portfolio market value, unrealized/realized P&L, today's change, open demo orders, learning tasks in progress, last EOD status, next recommended lesson.
- **Files to modify**: `src/pages/Dashboard.tsx`
- **New files**: `src/components/dashboard/DemoDashboard.tsx`, `src/components/dashboard/DemoAccountSummary.tsx`

### 4.2 — Add "What is this?" explainers to all KPIs
- **Priority**: P1
- **Description**: Every dashboard metric gets a tooltip/popover explaining the concept (e.g., "Buying power is the amount available to place new orders after accounting for pending orders and charges").
- **New files**: `src/components/ui/ExplainerTooltip.tsx`
- **Files to modify**: `src/components/dashboard/DemoDashboard.tsx`

### 4.3 — Add empty states with instructional CTAs
- **Priority**: P1
- **Description**: When user has no trades/positions/watchlist items, show instructional empty states guiding them to the next action (e.g., "You haven't placed any orders yet. Start with Lesson 1: Place Your First Order").
- **Files to modify**: Dashboard, Portfolio, Orders components

---

## Epic 5: Order Simulator

### 5.1 — Build demo order entry form
- **Priority**: P0
- **Description**: Order ticket supporting BUY/SELL, MARKET/LIMIT order types. Shows estimated charges before submission. Validates: sufficient buying power, valid quantity, active symbol.
- **New files**: `src/components/trading/DemoOrderTicket.tsx`
- **Files to modify**: `src/pages/TradingPage.tsx` (conditional render for demo mode)

### 5.2 — Build order simulation engine hook
- **Priority**: P0
- **Description**: `useDemoOrders` hook that handles order lifecycle: Draft → Submitted → Queued → Partially Filled → Filled / Cancelled / Rejected / Expired. Configurable fill rules, delay, partial fills, slippage.
- **New files**: `src/hooks/useDemoOrders.ts`
- **Simulation logic**: Market orders fill at last price ± slippage. Limit orders fill when price crosses limit. Reject if insufficient buying power.

### 5.3 — Build order lifecycle tracking UI
- **Priority**: P0
- **Description**: Open orders list showing real-time status progression. Each order shows "Why this was filled/rejected" explanation.
- **New files**: `src/components/trading/DemoOpenOrders.tsx`, `src/components/trading/OrderStatusExplainer.tsx`

### 5.4 — Implement rejection rules
- **Priority**: P1
- **Description**: Reject orders for: insufficient buying power, invalid quantity (< 1 or > max), inactive/halted symbol, exceeding position limits. Show clear rejection reason.
- **Files to modify**: `src/hooks/useDemoOrders.ts`

---

## Epic 6: Demo Portfolio

### 6.1 — Build demo portfolio view
- **Priority**: P0
- **Description**: Holdings list from `demo_positions`: symbol, quantity, avg cost, last price, market value, unrealized P&L, realized P&L. Sector exposure pie chart. Cash ledger summary.
- **New files**: `src/hooks/useDemoPortfolio.ts`, `src/components/portfolio/DemoPortfolioView.tsx`
- **Files to modify**: `src/pages/PortfolioPage.tsx` (conditional for demo mode)

### 6.2 — Add position detail with explanation
- **Priority**: P1
- **Description**: Click any holding to see: lot-level breakdown, trade history for that symbol, how avg cost was calculated, gross vs net P&L with charges.
- **New files**: `src/components/portfolio/DemoPositionDetail.tsx`

### 6.3 — Build activity timeline
- **Priority**: P1
- **Description**: Chronological timeline of all portfolio events: trades, charges, EOD adjustments, cash movements. Each entry has an explanation.
- **New files**: `src/components/portfolio/ActivityTimeline.tsx`

---

## Epic 7: Ledger & Balances

### 7.1 — Build cash ledger page
- **Priority**: P1
- **Description**: Display all `demo_cash_ledger` entries: starting cash, trade debits/credits, charges, realized P&L effects, manual resets, EOD adjustments. Running balance column.
- **New files**: `src/pages/CashLedgerPage.tsx`, `src/hooks/useDemoCashLedger.ts`
- **Files to modify**: `src/App.tsx` (add route), sidebar navigation

### 7.2 — Auto-record ledger entries on trade
- **Priority**: P1
- **Description**: When a demo order is filled, automatically create ledger entries for: trade amount (debit for buy, credit for sell), charges (debit), and update `demo_accounts.available_cash`.
- **Files to modify**: `src/hooks/useDemoOrders.ts`

---

## Epic 8: Charges Simulator

### 8.1 — Build fee rules configuration
- **Priority**: P1
- **Description**: Admin-configurable fee rules table supporting multiple components: brokerage commission (%), CDBL fee, regulatory fee, AIT, etc. Seed with standard Bangladesh fee structure.
- **DB seed**: Default fee rules in migration
- **New files**: `src/hooks/useFeeRules.ts`

### 8.2 — Show pre-trade estimated charges
- **Priority**: P1
- **Description**: On order ticket, before submission, show breakdown: gross trade value, each fee component, total charges, net cost/proceeds.
- **Files to modify**: `src/components/trading/DemoOrderTicket.tsx`

### 8.3 — Show post-trade actual charges
- **Priority**: P1
- **Description**: After fill, show actual charges applied. Explain gross vs net P&L difference.
- **New files**: `src/components/trading/TradeChargesBreakdown.tsx`

---

## Epic 9: EOD Replay Engine (Key Differentiator)

### 9.1 — Build EOD batch processing logic
- **Priority**: P0
- **Description**: Supabase Edge Function or client-side logic that processes all demo accounts at "end of day": close expired orders, book trades, update holdings, recalculate portfolio valuation, post charges, generate statements.
- **New files**: `src/services/eodProcessor.ts`, `src/hooks/useDemoEod.ts`
- **DB writes**: `eod_runs`, `eod_account_results`, `statements`

### 9.2 — Build EOD replay UI panel
- **Priority**: P0
- **Description**: Interactive panel where users can step through EOD events: "What happened today", "Why cash changed", "Why holdings changed", "Why P&L changed". Visual timeline with before/after states.
- **New files**: `src/pages/EodReplayPage.tsx`, `src/components/eod/EodReplayPanel.tsx`, `src/components/eod/EodTimeline.tsx`, `src/components/eod/EodExplainer.tsx`
- **Files to modify**: `src/App.tsx` (add route), sidebar navigation

### 9.3 — Build daily statement generator
- **Priority**: P1
- **Description**: Generate a contract-note-style daily statement per user: trade summary, charges breakdown, opening/closing balances, position changes. Viewable and downloadable.
- **New files**: `src/components/eod/DailyStatement.tsx`

### 9.4 — Add "Which lesson to read next" after EOD
- **Priority**: P1
- **Description**: After EOD replay, recommend the next relevant lesson based on what changed (e.g., if user had unrealized loss, suggest "Understanding Unrealized P&L" lesson).
- **Files to modify**: `src/components/eod/EodReplayPanel.tsx`

---

## Epic 10: Reports & Statements

### 10.1 — Build reports center page
- **Priority**: P1
- **Description**: Reports hub with tabs: Daily Activity, Trade History, Open vs Closed Positions, P&L Report, Charges Report, EOD Statement, Performance Trend, Mistake Log.
- **New files**: `src/pages/DemoReportsPage.tsx`, `src/hooks/useDemoReports.ts`
- **Files to modify**: `src/App.tsx` (add route), sidebar navigation

### 10.2 — Build trade history report
- **Priority**: P1
- **Description**: Filterable list of all demo trades with symbol, side, quantity, price, charges, net amount, date. Export to CSV.
- **New files**: `src/components/reports/TradeHistoryReport.tsx`

### 10.3 — Build P&L report
- **Priority**: P1
- **Description**: Realized + unrealized P&L by symbol, sector, and time period. Bar charts for visual comparison.
- **New files**: `src/components/reports/PnlReport.tsx`

### 10.4 — Build performance trend chart
- **Priority**: P2
- **Description**: Line chart showing portfolio value over time using EOD snapshots. Compare against DSEX benchmark.
- **New files**: `src/components/reports/PerformanceTrend.tsx`

### 10.5 — Build mistake log
- **Priority**: P2
- **Description**: Auto-detected trading mistakes: overtrading, concentration risk, frequent cancellations, chasing losses. Each with explanation and suggested lesson.
- **New files**: `src/components/reports/MistakeLog.tsx`, `src/services/mistakeDetector.ts`

---

## Epic 11: Learning Engine Enhancements

### 11.1 — Link lessons to trading actions
- **Priority**: P1
- **Description**: Map each lesson to a required simulated action. E.g., "Place Your First Limit Order" lesson requires user to actually place a limit order. Track completion via `lesson_tasks` + `user_lesson_progress`.
- **Files to modify**: `src/hooks/useLearning.ts`
- **New files**: `src/hooks/useLessonTasks.ts`

### 11.2 — Add scenario missions
- **Priority**: P1
- **Description**: Guided multi-step missions: "Buy 10 shares of BEXIMCO → Watch portfolio update → Run EOD → Read statement". Track progress per step.
- **New files**: `src/components/learning/ScenarioMission.tsx`, `src/data/missions.ts`

### 11.3 — Add reflection prompts after trade/EOD
- **Priority**: P2
- **Description**: After key actions (first trade, first loss, EOD), show a reflection prompt: "What did you learn?" with multiple-choice or free-text input. Store for progress assessment.
- **New files**: `src/components/learning/ReflectionPrompt.tsx`

### 11.4 — Compute readiness/confidence score
- **Priority**: P2
- **Description**: Aggregate score based on: lessons completed, quiz scores, trades placed, EOD replays viewed, mistakes avoided. Display on profile and dashboard.
- **New files**: `src/hooks/useReadinessScore.ts`, `src/components/learning/ReadinessScore.tsx`

---

## Epic 12: Coaching Layer

### 12.1 — Build coaching trigger system
- **Priority**: P1
- **Description**: Detect coaching-worthy events: first order, rejected order, loss above threshold, concentration in one stock, overtrading, repeated cancellation, poor risk discipline.
- **New files**: `src/services/coachingEngine.ts`, `src/hooks/useCoaching.ts`

### 12.2 — Build inline coaching UI
- **Priority**: P1
- **Description**: Non-intrusive coaching cards that appear contextually: inline explanation, suggested lesson link, risk note, recommended next task. Dismissible.
- **New files**: `src/components/coaching/CoachingCard.tsx`, `src/components/coaching/CoachingOverlay.tsx`

### 12.3 — Add "Explain this" links to all brokerage metrics
- **Priority**: P1
- **Description**: Every portfolio metric, order status, and balance field gets a clickable "Explain this" that opens a short educational popover with optional link to full lesson.
- **New files**: `src/components/ui/ExplainThis.tsx`

---

## Epic 13: Admin / Mentor Console

### 13.1 — Build admin learner overview
- **Priority**: P2
- **Description**: Admin page showing all demo learners: progress, readiness score, active/inactive, last activity. Filter by cohort.
- **New files**: `src/pages/AdminLearnersPage.tsx`, `src/hooks/useAdminLearners.ts`

### 13.2 — Add account management tools
- **Priority**: P2
- **Description**: Admin actions: reset demo account (clear positions, orders, restore starting cash), add virtual funds, view user timeline/audit log.
- **Files to modify**: `src/pages/AdminLearnersPage.tsx`

### 13.3 — Build cohort management
- **Priority**: P3
- **Description**: Create cohorts, assign users, assign learning journeys, track cohort-level progress and completion rates.
- **New files**: `src/pages/AdminCohortsPage.tsx`, `src/hooks/useCohorts.ts`

### 13.4 — Build contest system
- **Priority**: P3
- **Description**: Create time-bound trading contests with virtual accounts. Leaderboard by P&L or portfolio value. Prize display.
- **New files**: `src/pages/AdminContestsPage.tsx`, `src/hooks/useContests.ts`

### 13.5 — Build conversion readiness tracker
- **Priority**: P3
- **Description**: Track which demo users are "ready" for live brokerage based on readiness score, lessons completed, and trading activity. Export for sales team.
- **New files**: `src/components/admin/ConversionFunnel.tsx`

---

## Epic 14: Navigation & Information Architecture

### 14.1 — Update sidebar for demo mode
- **Priority**: P0
- **Description**: When in demo mode, sidebar shows: Dashboard, Market, Trade, Portfolio, EOD Replay, Reports, Learn, Profile. Secondary panels: Open Orders, Notifications, Coach Hints, Lesson Progress, Account Mode Badge.
- **Files to modify**: `src/components/layout/Sidebar.tsx`

### 14.2 — Add all new routes
- **Priority**: P0
- **Description**: Register routes for: Onboarding, Cash Ledger, EOD Replay, Demo Reports, Admin Learners, Admin Cohorts, Admin Contests.
- **Files to modify**: `src/App.tsx`

---

## Epic 15: Bangla Localization

### 15.1 — Add i18n framework
- **Priority**: P2
- **Description**: Integrate `react-i18next` or similar. Create translation files for Bangla and English. Wrap all user-facing strings.
- **New files**: `src/i18n/index.ts`, `src/i18n/en.json`, `src/i18n/bn.json`
- **Files to modify**: `src/App.tsx`, all page/component files

### 15.2 — Add language switcher
- **Priority**: P2
- **Description**: Language toggle in profile/settings. Persist preference. Default based on onboarding selection.
- **New files**: `src/components/ui/LanguageSwitcher.tsx`

---

## Epic 16: Brokerage Conversion Funnel

### 16.1 — Build live-account readiness checklist
- **Priority**: P3
- **Description**: When user reaches readiness score threshold, show a checklist of what they've learned and next steps to open a real brokerage account.
- **New files**: `src/components/conversion/ReadinessChecklist.tsx`

### 16.2 — Build real onboarding request flow
- **Priority**: P3
- **Description**: CTA to "Start Real Account" that captures interest and feeds into brokerage onboarding pipeline. Links to existing KYC flow.
- **New files**: `src/components/conversion/LiveAccountCTA.tsx`
- **Files to modify**: `src/pages/KycPage.tsx`

---

## Implementation Order (Recommended Phases)

### Phase 1 — Foundation (Weeks 1–3)
| Task | Epic | Priority |
|------|------|----------|
| 1.1–1.4 | DB Schema | P0 |
| 2.1–2.3 | Auth & Demo Mode | P0 |
| 14.1–14.2 | Navigation & Routes | P0 |
| 4.1 | Demo Dashboard | P0 |
| 3.1–3.3 | Learner Onboarding | P1 |

### Phase 2 — Core Trading Loop (Weeks 3–5)
| Task | Epic | Priority |
|------|------|----------|
| 5.1–5.3 | Order Simulator | P0 |
| 6.1 | Demo Portfolio | P0 |
| 7.1–7.2 | Cash Ledger | P1 |
| 8.1–8.3 | Charges Simulator | P1 |
| 5.4 | Rejection Rules | P1 |

### Phase 3 — EOD & Reports (Weeks 5–7)
| Task | Epic | Priority |
|------|------|----------|
| 9.1–9.2 | EOD Engine & Replay UI | P0 |
| 9.3–9.4 | Statements & Lesson Link | P1 |
| 10.1–10.3 | Reports Center | P1 |
| 6.2–6.3 | Position Detail & Timeline | P1 |

### Phase 4 — Learning & Coaching (Weeks 7–9)
| Task | Epic | Priority |
|------|------|----------|
| 11.1–11.2 | Lesson-Action Linking & Missions | P1 |
| 12.1–12.3 | Coaching System | P1 |
| 4.2–4.3 | Explainers & Empty States | P1 |

### Phase 5 — Scale & Polish (Weeks 9–12)
| Task | Epic | Priority |
|------|------|----------|
| 10.4–10.5 | Performance Trend & Mistake Log | P2 |
| 11.3–11.4 | Reflections & Readiness Score | P2 |
| 13.1–13.2 | Admin Learner Tools | P2 |
| 15.1–15.2 | Bangla Localization | P2 |

### Phase 6 — Conversion & Growth (Weeks 12+)
| Task | Epic | Priority |
|------|------|----------|
| 13.3–13.5 | Cohorts, Contests, Conversion | P3 |
| 16.1–16.2 | Live Account Funnel | P3 |

---

## Total Estimates

- **16 Epics**, **52 Tasks**
- **New files**: ~45 components, ~12 hooks, ~6 services, ~6 migrations, ~8 pages
- **Modified files**: ~15 existing files
- **New DB tables**: 15+
