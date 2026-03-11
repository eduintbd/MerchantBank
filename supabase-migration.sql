-- ============================================
-- HeroStock.AI — Database Migration
-- Creates all tables for the trading platform
-- ============================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'investor' CHECK (role IN ('admin', 'investor', 'agent', 'manager')),
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  nid_number TEXT,
  date_of_birth DATE,
  address TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bo_account TEXT,
  nominee_name TEXT,
  nominee_relation TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. STOCKS
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT 'General',
  last_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  change NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
  volume BIGINT NOT NULL DEFAULT 0,
  high NUMERIC(12,2) NOT NULL DEFAULT 0,
  low NUMERIC(12,2) NOT NULL DEFAULT 0,
  open NUMERIC(12,2) NOT NULL DEFAULT 0,
  close NUMERIC(12,2) NOT NULL DEFAULT 0,
  market_cap NUMERIC(18,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES stocks(id),
  stock_symbol TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price > 0),
  total_amount NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'partially_filled', 'cancelled', 'rejected')),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PORTFOLIO
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES stocks(id),
  stock_symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_buy_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

-- 5. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. LESSONS
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. USER_LESSON_PROGRESS
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- 8. QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  passing_score INTEGER NOT NULL DEFAULT 70,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. USER_QUIZ_ATTEMPTS
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'passed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, quiz_id)
);

-- 10. KYC_DOCUMENTS
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('nid_front', 'nid_back', 'photo', 'signature', 'bank_statement')),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. KYC_SUBMISSIONS
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id),
  referred_name TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'active', 'qualified')),
  commission_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. COMMISSIONS
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('registration', 'trading', 'bonus')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Stocks: everyone can read
CREATE POLICY "Anyone can view stocks" ON stocks FOR SELECT USING (true);

-- Orders: users see own, admins see all
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Portfolio: users see own
CREATE POLICY "Users can view own portfolio" ON portfolio FOR SELECT USING (auth.uid() = user_id);

-- Courses/Lessons/Quizzes: everyone can read
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Anyone can view quizzes" ON quizzes FOR SELECT USING (true);

-- User progress: own data only
CREATE POLICY "Users can manage own lesson progress" ON user_lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quiz attempts" ON user_quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- KYC: own data only, admins can view all
CREATE POLICY "Users can manage own kyc docs" ON kyc_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own kyc submission" ON kyc_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all kyc" ON kyc_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Referrals/Commissions: own data only
CREATE POLICY "Users can view own referrals" ON referrals FOR ALL USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view own commissions" ON commissions FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    'HERO-' || UPPER(SUBSTR(MD5(NEW.id::text), 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED: Sample stocks (top DSE companies)
-- ============================================

INSERT INTO stocks (symbol, company_name, sector, last_price, change, change_percent, volume, high, low, open, close) VALUES
  ('BSRMSTEEL', 'BSRM Steels Ltd.', 'Engineering', 85.50, 2.30, 2.76, 1250000, 86.00, 82.50, 83.20, 83.20),
  ('GP', 'Grameenphone Ltd.', 'Telecommunication', 385.60, -1.20, -0.31, 320000, 388.00, 383.00, 386.80, 386.80),
  ('SQURPHARMA', 'Square Pharmaceuticals', 'Pharmaceuticals', 215.40, 3.80, 1.80, 890000, 216.00, 211.00, 211.60, 211.60),
  ('BEXIMCO', 'Beximco Ltd.', 'Pharmaceuticals', 142.30, -0.90, -0.63, 2100000, 144.50, 141.00, 143.20, 143.20),
  ('WALTONHIL', 'Walton Hi-Tech Industries', 'Engineering', 1250.00, 15.00, 1.21, 45000, 1260.00, 1230.00, 1235.00, 1235.00),
  ('RENATA', 'Renata Ltd.', 'Pharmaceuticals', 1380.50, 8.50, 0.62, 28000, 1385.00, 1370.00, 1372.00, 1372.00),
  ('BRACBANK', 'BRAC Bank Ltd.', 'Bank', 38.90, 0.60, 1.57, 5600000, 39.20, 38.00, 38.30, 38.30),
  ('ISLAMIBANK', 'Islami Bank Bangladesh', 'Bank', 32.50, -0.30, -0.91, 4200000, 33.00, 32.10, 32.80, 32.80),
  ('DUTCHBANGL', 'Dutch-Bangla Bank', 'Bank', 62.80, 1.10, 1.78, 1800000, 63.20, 61.50, 61.70, 61.70),
  ('MARICO', 'Marico Bangladesh Ltd.', 'Pharmaceuticals', 2150.00, -25.00, -1.15, 12000, 2180.00, 2140.00, 2175.00, 2175.00),
  ('BERGERPBL', 'Berger Paints Bangladesh', 'Miscellaneous', 1650.00, 10.00, 0.61, 15000, 1655.00, 1635.00, 1640.00, 1640.00),
  ('LHBL', 'LafargeHolcim Bangladesh', 'Cement', 58.40, 0.80, 1.39, 3200000, 58.90, 57.20, 57.60, 57.60),
  ('POWERGRID', 'Power Grid Company', 'Power', 48.20, -0.40, -0.82, 1900000, 49.00, 47.80, 48.60, 48.60),
  ('BATBC', 'BAT Bangladesh', 'Food & Allied', 520.00, 5.50, 1.07, 95000, 522.00, 514.00, 514.50, 514.50),
  ('OLYMPIC', 'Olympic Industries', 'Engineering', 195.00, 2.10, 1.09, 650000, 196.50, 192.00, 192.90, 192.90)
ON CONFLICT (symbol) DO NOTHING;

-- ============================================
-- SEED: Sample courses for Learning Academy
-- ============================================

INSERT INTO courses (title, description, "order", total_lessons, is_required) VALUES
  ('Stock Market Basics', 'Learn the fundamentals of how the stock market works, what stocks are, and how trading happens on the DSE.', 1, 5, true),
  ('Understanding DSE & CSE', 'Deep dive into the Dhaka Stock Exchange and Chittagong Stock Exchange — indices, trading hours, regulations, and settlement.', 2, 4, true),
  ('Technical Analysis', 'Learn to read charts, identify patterns, use indicators like RSI, MACD, and Bollinger Bands to make informed trading decisions.', 3, 6, false),
  ('Fundamental Analysis', 'How to analyze company financials — EPS, P/E ratio, NAV, dividend yield — to find undervalued stocks on the DSE.', 4, 5, false),
  ('Risk Management', 'Position sizing, stop-loss strategies, portfolio diversification, and how to protect your capital in volatile markets.', 5, 4, true)
ON CONFLICT DO NOTHING;
