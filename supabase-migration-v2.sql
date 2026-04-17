-- ============================================
-- Abaci Investments — Schema V2 Migration
-- Adds: instrument, market_price_bar, fundamentals, news
-- ============================================

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE timeframe_enum AS ENUM ('D1', 'H1', 'M5');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_type_enum AS ENUM ('annual', 'quarterly', 'TTM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sentiment_enum AS ENUM ('positive', 'negative', 'neutral', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE news_source_type AS ENUM ('press_release', 'regulatory', 'media', 'analyst');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. INSTRUMENT (replaces stocks as the canonical entity)
CREATE TABLE IF NOT EXISTS public.instrument (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'DSE',
  instrument_type TEXT NOT NULL DEFAULT 'equity',
  isin TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sector TEXT,
  industry TEXT,
  company_name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(symbol, exchange)
);

-- 3. Migrate data from old stocks table (if it exists) preserving UUIDs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stocks') THEN
    INSERT INTO public.instrument (id, symbol, company_name, sector, status, exchange, instrument_type)
    SELECT id, symbol, company_name, COALESCE(sector, 'General'), 'active', 'DSE', 'equity'
    FROM public.stocks
    ON CONFLICT (symbol, exchange) DO NOTHING;
  END IF;
END $$;

-- Also seed from live_prices symbols not yet in instrument
INSERT INTO public.instrument (symbol, company_name, exchange, instrument_type, status)
SELECT DISTINCT lp.symbol, lp.symbol, 'DSE', 'equity', 'active'
FROM public.live_prices lp
WHERE NOT EXISTS (
  SELECT 1 FROM public.instrument i WHERE i.symbol = lp.symbol AND i.exchange = 'DSE'
)
ON CONFLICT (symbol, exchange) DO NOTHING;

-- 4. Add instrument_id FK to live_prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_prices' AND column_name = 'instrument_id'
  ) THEN
    ALTER TABLE public.live_prices ADD COLUMN instrument_id UUID REFERENCES public.instrument(id);
  END IF;
END $$;

-- Backfill instrument_id in live_prices
UPDATE public.live_prices lp
SET instrument_id = i.id
FROM public.instrument i
WHERE lp.symbol = i.symbol AND i.exchange = 'DSE'
  AND lp.instrument_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_live_prices_instrument_id ON public.live_prices(instrument_id);

-- 5. CALENDAR_TRADING_DAY
CREATE TABLE IF NOT EXISTS public.calendar_trading_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'DSE',
  is_trading_day BOOLEAN NOT NULL DEFAULT true,
  session_open TIME,
  session_close TIME,
  UNIQUE(date, exchange)
);

-- 6. MARKET_PRICE_BAR (historical OHLCV)
CREATE TABLE IF NOT EXISTS public.market_price_bar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES public.instrument(id),
  ts TIMESTAMPTZ NOT NULL,
  timeframe timeframe_enum NOT NULL DEFAULT 'D1',
  open NUMERIC(14,4),
  high NUMERIC(14,4),
  low NUMERIC(14,4),
  close NUMERIC(14,4),
  volume BIGINT DEFAULT 0,
  vwap NUMERIC(14,4),
  turnover NUMERIC(18,2),
  source TEXT,
  UNIQUE(instrument_id, ts, timeframe)
);

CREATE INDEX IF NOT EXISTS idx_price_bar_instrument_ts ON public.market_price_bar(instrument_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_price_bar_timeframe ON public.market_price_bar(timeframe, ts DESC);

-- 7. FUNDAMENTAL_SNAPSHOT
CREATE TABLE IF NOT EXISTS public.fundamental_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES public.instrument(id),
  report_type report_type_enum NOT NULL,
  fiscal_year INT NOT NULL,
  fiscal_period TEXT,
  period_start DATE,
  period_end DATE,
  currency TEXT NOT NULL DEFAULT 'BDT',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instrument_id, report_type, fiscal_year, fiscal_period)
);

CREATE INDEX IF NOT EXISTS idx_fs_instrument ON public.fundamental_snapshot(instrument_id, fiscal_year DESC);

-- 8. FUNDAMENTAL_VALUE (EAV for metrics)
CREATE TABLE IF NOT EXISTS public.fundamental_value (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundamental_snapshot_id UUID NOT NULL REFERENCES public.fundamental_snapshot(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL,
  metric_value NUMERIC(18,4),
  unit TEXT,
  UNIQUE(fundamental_snapshot_id, metric_code)
);

CREATE INDEX IF NOT EXISTS idx_fv_snapshot ON public.fundamental_value(fundamental_snapshot_id);

-- 9. NEWS_ARTICLE
CREATE TABLE IF NOT EXISTS public.news_article (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT,
  external_id TEXT,
  headline TEXT NOT NULL,
  summary TEXT,
  body_url TEXT,
  language TEXT DEFAULT 'en',
  published_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_type news_source_type,
  UNIQUE(provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_news_published ON public.news_article(published_at DESC);

-- 10. NEWS_ARTICLE_INSTRUMENT (many-to-many)
CREATE TABLE IF NOT EXISTS public.news_article_instrument (
  news_article_id UUID NOT NULL REFERENCES public.news_article(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instrument(id),
  relevance_score NUMERIC(3,2) DEFAULT 1.0,
  PRIMARY KEY (news_article_id, instrument_id)
);

CREATE INDEX IF NOT EXISTS idx_news_instrument ON public.news_article_instrument(instrument_id);

-- 11. NEWS_SENTIMENT
CREATE TABLE IF NOT EXISTS public.news_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_article_id UUID NOT NULL REFERENCES public.news_article(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  sentiment sentiment_enum NOT NULL,
  score NUMERIC(5,4),
  impact_score NUMERIC(5,4)
);

CREATE INDEX IF NOT EXISTS idx_news_sentiment_article ON public.news_sentiment(news_article_id);

-- 12. Update orders FK to point to instrument (if stocks table existed)
DO $$
BEGIN
  -- Drop old FK if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_stock_id_fkey' AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_stock_id_fkey;
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.instrument(id);
  END IF;
END $$;

-- 13. Update portfolio FK to point to instrument (if stocks table existed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'portfolio_stock_id_fkey' AND table_name = 'portfolio'
  ) THEN
    ALTER TABLE public.portfolio DROP CONSTRAINT portfolio_stock_id_fkey;
    ALTER TABLE public.portfolio
      ADD CONSTRAINT portfolio_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.instrument(id);
  END IF;
END $$;

-- 14. Create backward-compatible stocks VIEW (replaces table after dropping)
-- Only drop if it's a table, not already a view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stocks' AND table_type = 'BASE TABLE'
  ) THEN
    -- Drop RLS policies first
    DROP POLICY IF EXISTS "Anyone can view stocks" ON public.stocks;
    -- Drop the table
    DROP TABLE public.stocks;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.stocks AS
SELECT
  id,
  symbol,
  company_name,
  sector,
  category,
  status = 'active' AS is_active,
  created_at,
  updated_at
FROM public.instrument
WHERE exchange = 'DSE';

-- 15. ROW LEVEL SECURITY on new tables
ALTER TABLE public.instrument ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view instruments" ON public.instrument FOR SELECT USING (true);

ALTER TABLE public.calendar_trading_day ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view calendar" ON public.calendar_trading_day FOR SELECT USING (true);

ALTER TABLE public.market_price_bar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view price bars" ON public.market_price_bar FOR SELECT USING (true);

ALTER TABLE public.fundamental_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fundamentals" ON public.fundamental_snapshot FOR SELECT USING (true);

ALTER TABLE public.fundamental_value ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fundamental values" ON public.fundamental_value FOR SELECT USING (true);

ALTER TABLE public.news_article ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view news" ON public.news_article FOR SELECT USING (true);

ALTER TABLE public.news_article_instrument ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view news instruments" ON public.news_article_instrument FOR SELECT USING (true);

ALTER TABLE public.news_sentiment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view news sentiment" ON public.news_sentiment FOR SELECT USING (true);

-- 16. Ensure live_prices and market_indices have public read RLS
DO $$
BEGIN
  ALTER TABLE public.live_prices ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Anyone can view live_prices" ON public.live_prices;
  CREATE POLICY "Anyone can view live_prices" ON public.live_prices FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.market_indices ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Anyone can view market_indices" ON public.market_indices;
  CREATE POLICY "Anyone can view market_indices" ON public.market_indices FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
