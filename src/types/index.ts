// User & Auth Types
export type UserRole = 'admin' | 'investor' | 'agent' | 'manager';
export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  kyc_status: KycStatus;
  is_approved: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile extends User {
  nid_number?: string;
  tin_number?: string;
  date_of_birth?: string;
  address?: string;
  bank_name?: string;
  bank_account?: string;
  bo_account?: string;
  nominee_name?: string;
  nominee_relation?: string;
  family_info?: FamilyMember[];
}

export interface FamilyMember {
  name: string;
  relation: string;
  nid?: string;
  phone?: string;
}

// Trading Types
export type OrderType = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'executed' | 'partially_filled' | 'cancelled' | 'rejected';

export interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  sector: string;
  last_price: number;
  change: number;
  change_percent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  market_cap?: number;
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
  document_type: 'nid_front' | 'nid_back' | 'photo' | 'signature' | 'bank_statement';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
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

// Company Data Types
export interface CompanyFinancial {
  id: string;
  stock_symbol: string;
  year: number;
  quarter?: number;
  report_type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  data: Record<string, number>;
  published_at: string;
}

export interface CompanyNews {
  id: string;
  stock_symbol?: string;
  title: string;
  content?: string;
  source_url?: string;
  image_url?: string;
  published_at: string;
}

export interface CompanyManagement {
  id: string;
  stock_symbol: string;
  name: string;
  designation?: string;
  bio?: string;
  photo_url?: string;
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
