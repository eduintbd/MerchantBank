// ── Demo Account ──
export interface DemoAccount {
  id: string;
  user_id: string;
  account_code: string;
  currency_code: string;
  starting_cash: number;
  available_cash: number;
  buying_power: number;
  market_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  status: 'active' | 'suspended' | 'closed';
  created_at: string;
  updated_at: string;
}

// ── Demo Orders ──
export type DemoOrderSide = 'BUY' | 'SELL';
export type DemoOrderType = 'MARKET' | 'LIMIT';
export type DemoOrderStatus =
  | 'draft'
  | 'submitted'
  | 'queued'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export interface DemoOrder {
  id: string;
  demo_account_id: string;
  symbol: string;
  side: DemoOrderSide;
  order_type: DemoOrderType;
  quantity: number;
  limit_price: number | null;
  filled_quantity: number;
  avg_fill_price: number;
  status: DemoOrderStatus;
  rejected_reason: string | null;
  submitted_at: string | null;
  executed_at: string | null;
  created_at: string;
}

// ── Demo Trades ──
export interface DemoTrade {
  id: string;
  demo_order_id: string;
  demo_account_id: string;
  symbol: string;
  side: DemoOrderSide;
  quantity: number;
  price: number;
  gross_amount: number;
  total_charges: number;
  net_amount: number;
  trade_time: string;
}

// ── Demo Positions ──
export interface DemoPosition {
  id: string;
  demo_account_id: string;
  symbol: string;
  company_name?: string;
  quantity: number;
  avg_cost: number;
  market_price: number;
  market_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  updated_at: string;
}

// ── Cash Ledger ──
export type LedgerEntryType =
  | 'initial_funding'
  | 'trade_buy'
  | 'trade_sell'
  | 'charge'
  | 'eod_adjustment'
  | 'manual_credit'
  | 'manual_debit'
  | 'reset';

export interface DemoCashLedgerEntry {
  id: string;
  demo_account_id: string;
  entry_type: LedgerEntryType;
  reference_type: string | null;
  reference_id: string | null;
  debit: number;
  credit: number;
  balance_after: number;
  narration: string | null;
  created_at: string;
}

// ── Fee Rules & Charges ──
export interface FeeRule {
  id: string;
  name: string;
  fee_type: string;
  rate_type: 'percentage' | 'flat';
  rate_value: number;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
}

export interface FeeCharge {
  id: string;
  demo_trade_id: string;
  fee_rule_id: string;
  fee_name: string;
  amount: number;
  created_at: string;
}

export interface FeeBreakdown {
  rule: FeeRule;
  amount: number;
}

export interface ChargesEstimate {
  grossAmount: number;
  fees: FeeBreakdown[];
  totalCharges: number;
  netAmount: number;
}

// ── EOD Processing ──
export interface EodRun {
  id: string;
  business_date: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EodAccountResult {
  id: string;
  eod_run_id: string;
  demo_account_id: string;
  portfolio_value: number;
  total_charges: number;
  unrealized_pnl: number;
  realized_pnl: number;
  summary_json: EodSummary;
  created_at: string;
}

export interface EodSummary {
  ordersProcessed: number;
  ordersCancelled: number;
  tradesBooked: number;
  holdingsUpdated: number;
  chargesPosted: number;
  openingCash: number;
  closingCash: number;
  cashChange: number;
  holdingsChange: { symbol: string; qtyBefore: number; qtyAfter: number; reason: string }[];
  pnlChange: { realized: number; unrealized: number };
  nextLesson?: string;
}

// ── Coaching ──
export type CoachingTrigger =
  | 'first_order'
  | 'first_fill'
  | 'order_rejected'
  | 'loss_threshold'
  | 'concentration_risk'
  | 'overtrading'
  | 'repeated_cancellation'
  | 'eod_completed'
  | 'milestone_reached';

export type CoachingSeverity = 'info' | 'warning' | 'success';

export interface CoachingEvent {
  id: string;
  demo_account_id: string;
  trigger_type: CoachingTrigger;
  title: string;
  message: string;
  severity: CoachingSeverity;
  lesson_id: string | null;
  lesson_title: string | null;
  is_dismissed: boolean;
  created_at: string;
}

// ── Learning Tasks & Missions ──
export interface LessonTask {
  id: string;
  lesson_id: string;
  task_type: string;
  description: string;
  required_action: string;
  order: number;
}

export interface UserLessonTask {
  id: string;
  user_id: string;
  lesson_task_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface MissionStep {
  id: string;
  description: string;
  action_type: string;
  is_completed: boolean;
}

export interface ScenarioMission {
  id: string;
  title: string;
  description: string;
  steps: MissionStep[];
  xp_reward: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_completed: boolean;
  progress: number;
}

// ── Learner Profile ──
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type RiskAppetite = 'conservative' | 'moderate' | 'aggressive';
export type PreferredLanguage = 'en' | 'bn';

export interface LearnerProfile {
  id: string;
  user_id: string;
  experience_level: ExperienceLevel;
  risk_appetite: RiskAppetite;
  learning_goal: string;
  preferred_language: PreferredLanguage;
  readiness_score: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

// ── Statements ──
export interface DemoStatement {
  id: string;
  demo_account_id: string;
  eod_run_id: string;
  business_date: string;
  opening_cash: number;
  closing_cash: number;
  total_buys: number;
  total_sells: number;
  total_charges: number;
  portfolio_value: number;
  details_json: Record<string, any>;
  created_at: string;
}

// ── Reports ──
export interface TradeReport {
  symbol: string;
  side: DemoOrderSide;
  quantity: number;
  price: number;
  gross_amount: number;
  charges: number;
  net_amount: number;
  trade_time: string;
}

export interface PnlReport {
  symbol: string;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  total_charges: number;
  net_pnl: number;
}

export interface PerformancePoint {
  date: string;
  portfolio_value: number;
  cash: number;
  total_value: number;
}

export interface TradingMistake {
  id: string;
  type: 'overtrading' | 'concentration' | 'chasing_loss' | 'frequent_cancel' | 'poor_risk';
  title: string;
  description: string;
  severity: CoachingSeverity;
  detected_at: string;
  lesson_id?: string;
  lesson_title?: string;
}

// ── Readiness Score ──
export interface ReadinessBreakdown {
  lessonsCompleted: number;
  totalLessons: number;
  quizAvgScore: number;
  tradesPlaced: number;
  eodReplaysViewed: number;
  mistakesAvoided: number;
  totalScore: number;
  isReady: boolean;
}

// ── Admin / Cohorts ──
export interface Cohort {
  id: string;
  name: string;
  description: string;
  created_by: string;
  member_count: number;
  created_at: string;
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  user_id: string;
  user_name: string;
  readiness_score: number;
  joined_at: string;
}

export interface AdminLearnerView {
  user_id: string;
  full_name: string;
  email: string;
  demo_account_id: string;
  account_code: string;
  available_cash: number;
  portfolio_value: number;
  total_trades: number;
  lessons_completed: number;
  readiness_score: number;
  last_activity: string;
  status: string;
}
