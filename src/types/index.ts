// Re-export all demo types
export * from './demo';

// User & Auth Types
export type UserRole = 'admin' | 'investor' | 'agent' | 'manager' | 'risk_manager' | 'operations' | 'relationship_manager' | 'viewer';
export type KycStatus = 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired';
export type ClientStatus = 'active' | 'suspended' | 'closed' | 'pending_review';
export type InvestorCategory = 'RB' | 'MB' | 'FI' | 'NRB' | 'MF' | 'AMC' | 'EMP';
export type AccountType = 'Cash' | 'Margin';
export type AmlRiskLevel = 'low' | 'medium' | 'high';

export type SubscriptionTier = 'starter' | 'pro' | 'elite';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  kyc_status: KycStatus;
  is_approved: boolean;
  avatar_url?: string;
  subscription_tier?: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface Profile extends User {
  // Identity
  nid_number?: string;
  nid_type?: 'nid' | 'passport' | 'birth_cert';
  tin_number?: string;
  passport_number?: string;
  passport_expiry?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;

  // Family
  father_name?: string;
  mother_name?: string;
  family_info?: FamilyMember[];

  // Address
  address?: string;
  permanent_address?: string;
  present_address?: string;
  city?: string;
  district?: string;
  post_code?: string;

  // Occupation
  occupation?: string;
  organization?: string;
  income_source?: string;
  annual_income?: string;
  net_worth?: string;

  // Bank & BO
  bank_name?: string;
  bank_account?: string;
  bank_branch?: string;
  bank_routing_number?: string;
  bo_account?: string;
  bo_type?: 'individual' | 'joint' | 'corporate';
  cdbl_dp_id?: string;

  // Nominee (primary)
  nominee_name?: string;
  nominee_relation?: string;
  nominee_nid?: string;
  nominee_phone?: string;
  nominee_address?: string;
  nominee_share_pct?: number;
  nominee_dob?: string;

  // Investment profile
  investor_category?: InvestorCategory;
  account_type?: AccountType;
  investment_experience?: 'none' | '1-3yr' | '3-5yr' | '5yr+';
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
  investment_objective?: 'capital_preservation' | 'income' | 'growth' | 'speculation';

  // Client lifecycle
  client_status?: ClientStatus;
  client_code?: string;
  rm_id?: string;
  kyc_verified_at?: string;
  kyc_verified_by?: string;
  kyc_expiry?: string;
  last_kyc_update?: string;

  // Compliance
  is_pep?: boolean;
  pep_details?: string;
  is_ip?: boolean;
  aml_risk_level?: AmlRiskLevel;
  sanctions_checked_at?: string;
  declaration_signed?: boolean;
  declaration_signed_at?: string;
}

export interface FamilyMember {
  name: string;
  relation: string;
  nid?: string;
  phone?: string;
}

export interface Nominee {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  nid_number?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  share_percentage: number;
  document_url?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface KycApproval {
  id: string;
  user_id: string;
  action: 'submitted' | 'approved' | 'rejected' | 'returned' | 'escalated';
  status_from?: string;
  status_to?: string;
  reviewed_by?: string;
  reviewer_name?: string;
  reason?: string;
  notes?: string;
  documents_reviewed?: string[];
  created_at: string;
}

export interface ComplianceCheck {
  id: string;
  user_id: string;
  check_type: 'pep_screening' | 'sanctions' | 'aml_risk' | 'document_verification' | 'annual_review';
  result: 'pass' | 'fail' | 'flagged' | 'pending';
  details?: Record<string, unknown>;
  performed_by?: string;
  performed_at: string;
}

export interface ClientActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performed_by?: string;
  created_at: string;
}

export interface FeeScheduleItem {
  id: string;
  fee_type: 'commission' | 'exchange_fee' | 'cdbl_fee' | 'ait' | 'laga';
  rate: number;
  min_amount: number;
  max_amount?: number;
  description?: string;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
}

// Trading Types
export type OrderType = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'executed' | 'partially_filled' | 'cancelled' | 'rejected';

export type Exchange = 'DSE' | 'CSE';

export interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  sector: string;
  exchange: Exchange;
  last_price: number;
  change: number;
  change_percent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  market_cap?: number;
  trades?: number;
  value_traded?: number;
  week_52_high?: number;
  week_52_low?: number;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  stock_symbol: string;
  order_type: OrderType;
  quantity: number;
  price: number;
  total_amount: number;
  status: OrderStatus;
  executed_at?: string;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  stock_id: string;
  stock_symbol: string;
  company_name: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_profit_loss: number;
  total_profit_loss_percent: number;
  total_stocks: number;
  items: PortfolioItem[];
}

// Learning Types
export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type QuizStatus = 'not_started' | 'in_progress' | 'passed' | 'failed';

export interface Course {
  id: string;
  title: string;
  description: string;
  order: number;
  total_lessons: number;
  completed_lessons: number;
  is_required: boolean;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order: number;
  duration_minutes: number;
  status: LessonStatus;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  questions: QuizQuestion[];
  passing_score: number;
  status: QuizStatus;
  score?: number;
  attempts: number;
  max_attempts: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

// KYC Types
export interface KycDocument {
  id: string;
  user_id: string;
  document_type: 'nid_front' | 'nid_back' | 'photo' | 'signature' | 'bank_statement' | 'tin_cert' | 'bo_statement' | 'nominee_nid' | 'address_proof' | 'income_proof';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  file_size?: number;
  file_type?: string;
  expires_at?: string;
  version?: number;
  uploaded_at: string;
}

export interface KycSubmission {
  id: string;
  user_id: string;
  status: KycStatus;
  documents: KycDocument[];
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
}

// Marketing Types
export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_name: string;
  referred_email: string;
  status: 'pending' | 'registered' | 'active' | 'qualified';
  commission_earned: number;
  created_at: string;
}

export interface Commission {
  id: string;
  user_id: string;
  referral_id: string;
  amount: number;
  type: 'registration' | 'trading' | 'bonus';
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

export interface MarketingSummary {
  total_referrals: number;
  active_referrals: number;
  total_commission: number;
  pending_commission: number;
  referral_code: string;
}

// Dashboard Types
export interface DashboardStats {
  portfolio_value: number;
  portfolio_change: number;
  portfolio_change_percent: number;
  total_orders_today: number;
  pending_orders: number;
  total_commission: number;
  learning_progress: number;
  market_status: 'open' | 'closed' | 'pre_open';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// Market Overview Types (from DSE Portal Supabase)
export interface MarketIndex {
  index_name: string;
  value: number;
  change: number;
  change_pct: number;
  scraped_at: string;
}

export interface LivePrice {
  symbol: string;
  ltp: number;
  high: number;
  low: number;
  open: number;
  close_prev: number;
  change: number;
  change_pct: number;
  volume: number;
  value_traded: number;
  trades: number;
  scraped_at: string;
}

export interface MarketStats {
  totalVolume: number;
  totalValue: number;
  totalTrades: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  totalStocks: number;
}

export type MarketSentiment = 'Bull' | 'Mild Bull' | 'Neutral' | 'Mild Bear' | 'Bear';
export type TopMoverTab = 'gainer' | 'loser' | 'volume' | 'value' | 'trade';

// Social Feed Types
export interface Post {
  id: string;
  user_id: string;
  stock_symbol?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

// IPO Types
export type IpoStatus = 'upcoming' | 'open' | 'closed' | 'listed';

export interface Ipo {
  id: string;
  company_name: string;
  symbol?: string;
  sector: string;
  offer_price: number;
  lot_size: number;
  subscription_start: string;
  subscription_end: string;
  listing_date?: string;
  status: IpoStatus;
  prospectus_url?: string;
  created_at: string;
}

export interface IpoApplication {
  id: string;
  user_id: string;
  ipo_id: string;
  lots_applied: number;
  amount: number;
  status: 'pending' | 'allotted' | 'refunded';
  created_at: string;
}

// Instrument (canonical entity for tradable securities)
export interface Instrument {
  id: string;
  symbol: string;
  exchange: string;
  instrument_type: string;
  isin?: string;
  status: string;
  sector?: string;
  industry?: string;
  company_name: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

// Historical OHLCV price bars
export interface MarketPriceBar {
  id: string;
  instrument_id: string;
  ts: string;
  timeframe: 'D1' | 'H1' | 'M5';
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  turnover?: number;
  source?: string;
}

// Fundamental snapshot (period-level container)
export interface FundamentalSnapshot {
  id: string;
  instrument_id: string;
  report_type: 'annual' | 'quarterly' | 'TTM';
  fiscal_year: number;
  fiscal_period?: string;
  period_start?: string;
  period_end?: string;
  currency: string;
  source?: string;
}

// Fundamental metric value (EAV)
export interface FundamentalValue {
  id: string;
  fundamental_snapshot_id: string;
  metric_code: string;
  metric_value: number | null;
  unit?: string;
}

// News article
export interface NewsArticle {
  id: string;
  provider?: string;
  external_id?: string;
  headline: string;
  summary?: string;
  body_url?: string;
  language?: string;
  published_at: string;
  ingested_at: string;
  source_type?: string;
}

// Company Data Types (backward-compatible display interfaces)
export interface CompanyFinancial {
  id: string;
  symbol: string;
  year: number;
  revenue?: number;
  net_income?: number;
  eps?: number;
  nav_per_share?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  total_assets?: number;
  total_liabilities?: number;
  operating_profit?: number;
}

export interface CompanyNews {
  id: string;
  symbol?: string;
  title: string;
  summary?: string;
  source?: string;
  url?: string;
  published_at: string;
  created_at: string;
}

export interface CompanyManagement {
  id: string;
  symbol: string;
  name: string;
  designation?: string;
  bio?: string;
  image_url?: string;
  order?: number;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type?: string;
  title: string;
  message?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_alerts: boolean;
  sms_alerts: boolean;
  price_alerts: boolean;
  order_alerts: boolean;
  news_alerts: boolean;
}

// Gamification Types
export interface Achievement {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  xp_reward: number;
  criteria_type?: string;
  criteria_value?: number;
  earned?: boolean;
  earned_at?: string;
}

export interface UserXp {
  total_xp: number;
  level: number;
  streak_days: number;
  last_activity?: string;
}

// Investor Profile Types
export interface InvestorProfile {
  id: string;
  user_id: string;
  display_name?: string;
  bio?: string;
  is_public: boolean;
  total_return_pct: number;
  rank?: number;
  followers_count: number;
}

// Finance Tracker Types
export interface IncomeExpense {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

// Portfolio Snapshot
export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  date: string;
  total_value: number;
  total_invested: number;
  snapshot_data?: Record<string, any>;
}

// ESG Types
export interface EsgRating {
  rating: 'A' | 'B' | 'C';
  label: string;
}

// Historical Data
export interface HistoricalDataPoint {
  date: string;
  dsex: number;
  dses: number;
  ds30: number;
}

// ============================================================
// Portfolio Management Types (Merchant Bank)
// ============================================================

export interface ModelPortfolio {
  id: string;
  name: string;
  description?: string;
  strategy?: string;
  risk_level?: string;
  benchmark?: string;
  target_allocations?: Record<string, Record<string, number>>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientPortfolio {
  id: string;
  client_id: string;
  model_portfolio_id?: string;
  portfolio_name: string;
  inception_date: string;
  strategy?: string;
  risk_level?: string;
  status: 'active' | 'suspended' | 'closed' | 'liquidating';
  management_fee_rate: number;
  performance_fee_rate: number;
  hurdle_rate: number;
  high_water_mark: number;
  initial_deposit: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  client_name?: string;
  client_email?: string;
}

export interface PortfolioHolding {
  id: string;
  portfolio_id: string;
  client_id: string;
  isin?: string;
  symbol: string;
  security_name?: string;
  exchange: string;
  quantity: number;
  avg_cost: number;
  total_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_pl_pct: number;
  realized_pl: number;
  weight_pct: number;
  sector?: string;
  category?: string;
  settlement_qty: number;
  saleable_qty: number;
  last_updated: string;
}

export type TransactionType = 'buy' | 'sell' | 'dividend_cash' | 'dividend_stock' | 'rights' | 'bonus' | 'ipo_allotment' | 'transfer_in' | 'transfer_out' | 'split' | 'merger';

export interface PortfolioTransaction {
  id: string;
  portfolio_id: string;
  client_id: string;
  transaction_type: TransactionType;
  symbol: string;
  isin?: string;
  quantity: number;
  price: number;
  gross_value: number;
  commission: number;
  exchange_fee: number;
  cdbl_fee: number;
  ait: number;
  other_charges: number;
  net_value: number;
  trade_date: string;
  settlement_date?: string;
  is_settled: boolean;
  source: 'manual' | 'broker_api' | 'broker_file' | 'cdbl' | 'corporate_action';
  broker_ref?: string;
  broker_name?: string;
  status: 'pending' | 'confirmed' | 'settled' | 'cancelled' | 'disputed';
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioValuationRecord {
  id: string;
  portfolio_id: string;
  client_id: string;
  valuation_date: string;
  total_market_value: number;
  total_cost: number;
  cash_balance: number;
  receivables: number;
  payables: number;
  nav: number;
  day_pl: number;
  day_pl_pct: number;
  inception_pl: number;
  inception_pl_pct: number;
  num_holdings: number;
  top_holding_symbol?: string;
  top_holding_weight: number;
  holdings_snapshot?: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Corporate Actions Types
// ============================================================

export type CorporateActionType = 'cash_dividend' | 'stock_dividend' | 'rights_issue' | 'bonus_share' | 'stock_split' | 'merger' | 'ipo';

export interface CorporateAction {
  id: string;
  action_type: CorporateActionType;
  symbol: string;
  isin?: string;
  security_name?: string;
  record_date?: string;
  ex_date?: string;
  payment_date?: string;
  declaration_date?: string;
  rate?: number;
  ratio_from?: number;
  ratio_to?: number;
  face_value?: number;
  status: 'declared' | 'ex_date_passed' | 'record_date_set' | 'processing' | 'applied' | 'completed';
  affected_clients: number;
  total_amount: number;
  notes?: string;
  source?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Custodian Types
// ============================================================

export interface CustodianAccount {
  id: string;
  client_id: string;
  bo_account: string;
  dp_id?: string;
  cdbl_member_id?: string;
  account_type: 'individual' | 'joint' | 'corporate' | 'omnibus';
  status: 'active' | 'frozen' | 'suspended' | 'closed';
  opened_date?: string;
  linked_bank_account?: string;
  linked_bank_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SettlementRecord {
  id: string;
  transaction_id?: string;
  portfolio_id: string;
  client_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  amount: number;
  trade_date: string;
  settlement_date: string;
  status: 'pending' | 'partial' | 'settled' | 'failed' | 'cancelled';
  broker_name?: string;
  broker_ref?: string;
  settled_at?: string;
  settled_amount?: number;
  discrepancy: number;
  notes?: string;
  created_at: string;
}

// ============================================================
// Client Fund Accounting Types
// ============================================================

export interface FundAccount {
  id: string;
  client_id: string;
  portfolio_id?: string;
  account_name: string;
  currency: string;
  cash_balance: number;
  receivables: number;
  payables: number;
  available_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  total_fees_charged: number;
  total_dividends_received: number;
  status: 'active' | 'frozen' | 'closed';
  last_transaction_date?: string;
  created_at: string;
  updated_at: string;
}

export type FundLedgerEntryType = 'deposit' | 'withdrawal' | 'buy_settlement' | 'sell_settlement' | 'management_fee' | 'performance_fee' | 'custody_fee' | 'dividend' | 'interest' | 'ipo_application' | 'ipo_refund' | 'adjustment' | 'transfer';

export interface ClientFundLedgerEntry {
  id: string;
  fund_account_id: string;
  client_id: string;
  portfolio_id?: string;
  entry_type: FundLedgerEntryType;
  description: string;
  reference_id?: string;
  reference_type?: string;
  debit: number;
  credit: number;
  running_balance: number;
  instrument?: string;
  counterparty?: string;
  value_date: string;
  recorded_by?: string;
  approved_by?: string;
  status: 'pending_approval' | 'posted' | 'reversed';
  reversal_of?: string;
  created_at: string;
}

export interface FeeBilling {
  id: string;
  client_id: string;
  portfolio_id: string;
  fee_type: 'management_fee' | 'performance_fee' | 'custody_fee' | 'advisory_fee' | 'other';
  billing_period_start: string;
  billing_period_end: string;
  aum_basis: number;
  fee_rate: number;
  calculated_amount: number;
  discount: number;
  vat: number;
  net_amount: number;
  period_return?: number;
  hurdle_return?: number;
  excess_return?: number;
  status: 'draft' | 'approved' | 'invoiced' | 'paid' | 'waived' | 'reversed';
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FundRequest {
  id: string;
  client_id: string;
  fund_account_id?: string;
  request_type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  payment_method?: string;
  bank_name?: string;
  bank_account?: string;
  cheque_number?: string;
  transaction_reference?: string;
  status: 'requested' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Broker Integration Types
// ============================================================

export interface BrokerConnection {
  id: string;
  broker_name: string;
  broker_code: string;
  api_base_url?: string;
  api_version: string;
  auth_method: 'api_key' | 'oauth2' | 'hmac';
  supports_realtime: boolean;
  supports_websocket: boolean;
  supports_file_upload: boolean;
  status: 'sandbox' | 'testing' | 'active' | 'suspended' | 'disconnected';
  last_heartbeat?: string;
  last_error?: string;
  tech_contact_name?: string;
  tech_contact_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type BrokerOrderStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';

export interface BrokerOrder {
  id: string;
  broker_id: string;
  portfolio_id?: string;
  client_id: string;
  abaci_order_id: string;
  broker_order_id?: string;
  symbol: string;
  isin?: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  limit_price?: number;
  time_in_force: 'DAY' | 'IOC' | 'GTC';
  board: 'PUBLIC' | 'BLOCK' | 'SPOT';
  status: BrokerOrderStatus;
  filled_qty: number;
  avg_fill_price: number;
  remaining_qty: number;
  rejection_reason?: string;
  submitted_at?: string;
  accepted_at?: string;
  completed_at?: string;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  broker_name?: string;
  client_name?: string;
}

export type ExecProcessingStatus = 'received' | 'matched' | 'applied' | 'failed' | 'duplicate';

export interface BrokerExecution {
  id: string;
  broker_id: string;
  exec_id: string;
  broker_order_id?: string;
  abaci_order_id?: string;
  client_code: string;
  client_id?: string;
  symbol: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  exec_type: 'FILL' | 'PARTIAL_FILL' | 'CANCEL' | 'REJECT';
  exec_qty: number;
  exec_price: number;
  gross_value: number;
  commission: number;
  exchange_fee: number;
  cdbl_fee: number;
  ait: number;
  net_value: number;
  trade_date: string;
  settlement_date?: string;
  exec_time?: string;
  processing_status: ExecProcessingStatus;
  error_message?: string;
  source: 'webhook' | 'api_poll' | 'file_import' | 'manual';
  received_at: string;
  created_at: string;
}

export interface ReconciliationRun {
  id: string;
  broker_id?: string;
  recon_date: string;
  recon_type: 'trade' | 'position' | 'settlement' | 'cash';
  status: 'running' | 'completed' | 'failed' | 'partial';
  total_items: number;
  matched: number;
  mismatched: number;
  missing_abaci: number;
  missing_broker: number;
  total_discrepancy_value: number;
  summary?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  triggered_by?: string;
  data_source?: string;
  created_at: string;
}

export type ReconMatchStatus = 'matched' | 'qty_mismatch' | 'price_mismatch' | 'cost_mismatch' | 'missing_abaci' | 'missing_broker' | 'value_mismatch';

export interface ReconciliationItem {
  id: string;
  recon_run_id: string;
  item_type: 'holding' | 'trade' | 'settlement' | 'cash_balance';
  client_id?: string;
  client_code?: string;
  symbol?: string;
  match_status: ReconMatchStatus;
  abaci_qty?: number;
  abaci_price?: number;
  abaci_value?: number;
  abaci_avg_cost?: number;
  broker_qty?: number;
  broker_price?: number;
  broker_value?: number;
  broker_avg_cost?: number;
  qty_diff: number;
  value_diff: number;
  cost_diff: number;
  resolution_status: 'open' | 'investigating' | 'resolved' | 'accepted';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  client_name?: string;
}
