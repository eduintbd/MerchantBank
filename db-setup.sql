-- ============================================
-- HeroStock.AI — Database Setup
-- Run this in Supabase SQL Editor (fnwmvopralrpvryncxdc)
-- https://supabase.com/dashboard/project/fnwmvopralrpvryncxdc/sql
--
-- DONE via API: lessons seeded (9 lessons), referral codes set
-- STILL NEEDED: quizzes table, quiz_attempts table, signup trigger
-- ============================================

-- 1. Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id),
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  passing_score integer DEFAULT 70,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read quizzes" ON public.quizzes;
CREATE POLICY "Anyone can read quizzes" ON public.quizzes FOR SELECT USING (true);

-- 2. Create quiz_attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  quiz_id uuid REFERENCES public.quizzes(id),
  answers jsonb NOT NULL DEFAULT '{}',
  score integer,
  passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can read own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert attempts" ON public.quiz_attempts;
CREATE POLICY "Users can insert attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, kyc_status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'investor',
    'pending',
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Seed lessons for existing courses
INSERT INTO public.lessons (id, course_id, title, content, sort_order) VALUES
  -- DSE Basics
  (gen_random_uuid(), 'c8f04099-d216-4382-b673-55c77a4e9cfc', 'What is the DSE?', 'The Dhaka Stock Exchange (DSE) is the main stock exchange of Bangladesh, established in 1954. It is one of the oldest exchanges in South Asia. The DSE facilitates buying and selling of shares, debentures, and mutual fund units for listed companies. Understanding the DSE is the first step to becoming a successful investor in Bangladesh.', 1),
  (gen_random_uuid(), 'c8f04099-d216-4382-b673-55c77a4e9cfc', 'How Stock Trading Works', 'Stock trading involves buying shares at a lower price and selling at a higher price. Orders are placed through licensed brokers or online trading platforms like HeroStock.AI. The DSE uses a T+2 settlement cycle — meaning trades settle 2 business days after execution. Key order types include Market Orders (execute immediately at best price) and Limit Orders (execute only at your specified price or better).', 2),
  (gen_random_uuid(), 'c8f04099-d216-4382-b673-55c77a4e9cfc', 'Understanding DSEX, DSES & DS30', 'DSEX is the benchmark index of the DSE, tracking all listed companies weighted by free-float market capitalization. DSES (DSE Shariah Index) tracks Shariah-compliant stocks. DS30 tracks the top 30 most liquid stocks. When these indices go up, it generally means the overall market is performing well. As an investor, tracking these indices helps you understand market trends and sentiment.', 3),

  -- Reading Stock Charts
  (gen_random_uuid(), '7da8813f-4914-4261-bd75-aa5ef3adf2a6', 'Candlestick Basics', 'Candlestick charts show four key prices: Open, High, Low, and Close (OHLC). A green/white candle means the close was higher than the open (bullish). A red/black candle means the close was lower (bearish). The body shows the open-close range, while wicks/shadows show the high-low range. Learning to read candlesticks is fundamental to technical analysis.', 1),
  (gen_random_uuid(), '7da8813f-4914-4261-bd75-aa5ef3adf2a6', 'Support & Resistance', 'Support is a price level where buying pressure prevents further decline. Resistance is where selling pressure prevents further rise. These levels form because of market psychology — traders remember past price points. When a stock bounces off support multiple times, it becomes a stronger level. When resistance breaks, it often becomes new support.', 2),
  (gen_random_uuid(), '7da8813f-4914-4261-bd75-aa5ef3adf2a6', 'Volume Analysis', 'Volume represents the number of shares traded in a given period. High volume confirms price movements — a breakout on high volume is more reliable than one on low volume. Volume precedes price: unusual volume spikes often signal upcoming price moves. Combine volume with price patterns for more accurate trading decisions.', 3),

  -- Fundamental Analysis
  (gen_random_uuid(), '1fe702b5-3534-40d6-9607-23806ed371bb', 'EPS & P/E Ratio', 'Earnings Per Share (EPS) = Net Profit / Total Shares. It tells you how much profit each share generates. Price-to-Earnings (P/E) Ratio = Share Price / EPS. A lower P/E may indicate an undervalued stock, while a higher P/E suggests investors expect growth. Compare P/E ratios within the same sector for meaningful analysis.', 1),
  (gen_random_uuid(), '1fe702b5-3534-40d6-9607-23806ed371bb', 'NAV & Book Value', 'Net Asset Value (NAV) per share = (Total Assets - Total Liabilities) / Total Shares. It represents the intrinsic value of each share based on the company''s balance sheet. If a stock trades below its NAV, it may be undervalued. The Price-to-Book (P/B) ratio compares market price to book value — a P/B below 1 could indicate a bargain.', 2),
  (gen_random_uuid(), '1fe702b5-3534-40d6-9607-23806ed371bb', 'Dividend Analysis', 'Dividends are portions of profit distributed to shareholders. Cash dividends are paid in BDT per share, while stock dividends give additional shares. Dividend Yield = Annual Dividend / Share Price. Consistent dividend-paying companies are generally more stable. Check the dividend history on HeroStock.AI to identify reliable income stocks on the DSE.', 3)
ON CONFLICT DO NOTHING;

-- 5. Disable email confirmation for new signups (allow immediate login)
-- Note: This must be done in Supabase Dashboard > Auth > Settings > Email Auth
-- Uncheck "Enable email confirmations"
