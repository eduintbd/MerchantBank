-- Social Media Aggregation Table
-- Stores hot posts from Twitter/X, Facebook, Reddit, YouTube related to DSE/Bangladesh stock market

CREATE TABLE IF NOT EXISTS social_media_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('twitter', 'facebook', 'reddit', 'youtube', 'linkedin', 'news')),
  external_id text,                    -- Platform-specific post ID
  author_name text NOT NULL,
  author_handle text,                  -- @handle or username
  author_avatar_url text,
  author_verified boolean DEFAULT false,
  content text NOT NULL,
  media_url text,                      -- Image/video thumbnail
  post_url text,                       -- Link to original post
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,

  -- Stock relevance
  symbols text[] DEFAULT '{}',         -- Mentioned stock symbols e.g. {'GP', 'BXPHARMA'}
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  relevance_score numeric(3,2) DEFAULT 0.50,  -- 0.00 to 1.00, how relevant to DSE

  -- Categorization
  category text DEFAULT 'general' CHECK (category IN ('market', 'stock', 'ipo', 'regulation', 'analysis', 'opinion', 'breaking', 'general')),
  tags text[] DEFAULT '{}',
  language text DEFAULT 'en' CHECK (language IN ('en', 'bn')),

  -- Timestamps
  posted_at timestamptz NOT NULL,      -- When originally posted on platform
  scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  -- Dedup
  UNIQUE(platform, external_id)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_smp_posted_at ON social_media_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_smp_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_smp_relevance ON social_media_posts(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_smp_category ON social_media_posts(category);
CREATE INDEX IF NOT EXISTS idx_smp_symbols ON social_media_posts USING gin(symbols);

-- RLS: public read access
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read social_media_posts"
  ON social_media_posts FOR SELECT
  USING (true);

-- Insert sample data for demo
INSERT INTO social_media_posts (platform, author_name, author_handle, author_verified, content, post_url, likes_count, comments_count, shares_count, symbols, sentiment, relevance_score, category, tags, language, posted_at) VALUES
('twitter', 'DSE Market Watch', '@dse_watch', true, 'DSEX crosses 5,800 mark! Banking stocks leading the rally. BRACBANK +4.2%, DUTCHBANGLA +3.8%, EBL +2.9%. Turnover hits BDT 1,200Cr — highest in 3 months. Bull run continues! 🐂📈 #DSE #BangladeshStocks', 'https://twitter.com/dse_watch/status/123', 245, 42, 89, '{BRACBANK,DUTCHBANGLA,EBL}', 'positive', 0.95, 'market', '{rally,banking,turnover}', 'en', now() - interval '1 hour'),

('twitter', 'BD Stock Analyst', '@bd_stock_pro', true, 'GP declares 12% interim cash dividend for FY2025-26. Record date April 5. At current price, annualized yield ~5.2%. Strong free cash flow supports continued payouts. HOLD rating maintained. #GP #Dividend', 'https://twitter.com/bd_stock_pro/status/124', 189, 31, 56, '{GP}', 'positive', 0.92, 'stock', '{dividend,GP,telecom}', 'en', now() - interval '2 hours'),

('facebook', 'Bangladesh Stock Exchange Community', 'BDStockCommunity', false, 'আজকের মার্কেট সামারি: DSEX +1.2%, মোট টার্নওভার ১,২০০ কোটি টাকা। ব্যাংকিং সেক্টর সবচেয়ে ভালো পারফর্ম করেছে। BEXIMCO Pharma WHO প্রিকোয়ালিফিকেশন পেয়েছে - শেয়ার দাম ৫% বেড়েছে।', 'https://facebook.com/BDStockCommunity/posts/456', 523, 87, 134, '{BXPHARMA}', 'positive', 0.88, 'market', '{summary,bangla,pharma}', 'bn', now() - interval '3 hours'),

('reddit', 'u/dse_investor_bd', 'dse_investor_bd', false, 'Foreign investors sold BDT 245Cr this week - 3rd consecutive week of net selling. Pharma and textile sectors hit hardest. Is this the start of a larger correction or just profit-taking? What are your positions?', 'https://reddit.com/r/BangladeshStocks/comments/abc123', 67, 43, 12, '{}', 'negative', 0.85, 'analysis', '{foreign,selling,correction}', 'en', now() - interval '4 hours'),

('twitter', 'BSEC Updates BD', '@bsec_updates', true, 'BREAKING: BSEC approves new margin loan guidelines for retail investors. Higher margin ratios now available for qualified investors with 2+ years trading history. Full circular: bsec.gov.bd/circular/2026-03 #BSEC #Regulation', 'https://twitter.com/bsec_updates/status/125', 312, 56, 98, '{}', 'neutral', 0.90, 'regulation', '{BSEC,margin,regulation}', 'en', now() - interval '5 hours'),

('youtube', 'Stock Market BD', 'StockMarketBD', true, '🔴 LIVE: Top 5 Stocks to Watch This Week | DSEX Analysis | March 2026 | Technical analysis of BEXIMCO, GP, BRACBANK, SQURPHARMA, and BATBC. Support/resistance levels and entry points discussed.', 'https://youtube.com/watch?v=xyz789', 1200, 234, 89, '{BXPHARMA,GP,BRACBANK,SQURPHARMA,BATBC}', 'neutral', 0.82, 'analysis', '{technical,weekly,video}', 'en', now() - interval '6 hours'),

('twitter', 'IPO Tracker BD', '@ipo_tracker_bd', false, 'TechBangla Limited IPO subscription opens TOMORROW! Fixed price BDT 30/share, lot size 500. Company P/E ratio looks reasonable at 18x vs sector avg 22x. Oversubscription expected 3-4x based on pre-orders. Apply early! #IPO', 'https://twitter.com/ipo_tracker_bd/status/126', 156, 28, 45, '{}', 'positive', 0.88, 'ipo', '{IPO,TechBangla,subscription}', 'en', now() - interval '8 hours'),

('facebook', 'Dhaka Stock Exchange Investors', 'DSEInvestors', false, 'BEXIMCO Pharma receives WHO prequalification for new antibiotic! This opens up massive export opportunity to 120+ countries. Revenue impact expected from Q3 FY26. Stock already up 5% today. Target price revised to BDT 180.', 'https://facebook.com/DSEInvestors/posts/789', 678, 112, 201, '{BXPHARMA}', 'positive', 0.91, 'stock', '{pharma,WHO,export}', 'en', now() - interval '10 hours'),

('linkedin', 'Md. Rahman, CFA', 'md_rahman_cfa', true, 'Bangladesh Bank keeps policy rate unchanged at 8.5%. My analysis: This is net positive for equities. Lower rate pressure means cheaper corporate borrowing → higher earnings growth. Banking sector NIM may compress slightly but loan growth should offset. DSE likely to test 6,000 by Q2.', 'https://linkedin.com/posts/md_rahman_cfa/abc', 89, 23, 34, '{}', 'positive', 0.86, 'analysis', '{monetary,policy,banking}', 'en', now() - interval '12 hours'),

('twitter', 'Market Pulse BD', '@market_pulse_bd', false, 'Sector rotation happening in DSE. Money moving FROM textiles TO pharma & banking. Textile index down 2.3% this week while pharma index up 3.1%. Follow the smart money! Here''s my sector allocation for March...', 'https://twitter.com/market_pulse_bd/status/127', 198, 45, 67, '{}', 'neutral', 0.83, 'analysis', '{sector,rotation,allocation}', 'en', now() - interval '14 hours'),

('reddit', 'u/bdmarket_guru', 'bdmarket_guru', false, 'DD: Why SQURPHARMA is undervalued at current levels. Revenue growing 15% YoY, expanding into generics, strong balance sheet with 0.3x D/E. P/E at 14x vs pharma sector avg 20x. Fair value estimate: BDT 320 (currently at BDT 245). Disclosure: Long position.', 'https://reddit.com/r/BangladeshStocks/comments/def456', 134, 78, 23, '{SQURPHARMA}', 'positive', 0.89, 'analysis', '{DD,pharma,valuation}', 'en', now() - interval '18 hours'),

('twitter', 'BD Fintech News', '@bd_fintech', true, 'EXCLUSIVE: Abaci Investments, a new AI-powered investment education platform, is preparing for April launch. Features include demo trading with virtual coins, AI stock analysis agents, and structured learning courses for new DSE investors. Could this be a game-changer? 🚀', 'https://twitter.com/bd_fintech/status/128', 423, 89, 156, '{}', 'positive', 0.75, 'general', '{fintech,AI,education,Abaci}', 'en', now() - interval '20 hours'),

('facebook', 'পুঁজিবাজার বাংলাদেশ', 'PunjibazarBD', false, 'সতর্কতা: আগামীকাল মার্কেট ভোলাটাইল হতে পারে। বৈদেশিক বিনিয়োগকারীদের বিক্রির চাপ অব্যাহত। তবে ব্যাংকিং ও ফার্মা সেক্টরে ভালো সাপোর্ট আছে। স্টপ-লস মেইনটেইন করুন।', 'https://facebook.com/PunjibazarBD/posts/012', 345, 67, 89, '{}', 'negative', 0.80, 'opinion', '{warning,volatility,bangla}', 'bn', now() - interval '22 hours'),

('youtube', 'Finance Academy BD', 'FinanceAcademyBD', false, 'শেয়ার বাজারে নতুন? এই ৫টি ভুল করবেন না! | Beginner Stock Market Mistakes Bangladesh | Complete guide for new investors entering the Dhaka Stock Exchange.', 'https://youtube.com/watch?v=learn123', 890, 156, 67, '{}', 'neutral', 0.70, 'general', '{education,beginner,bangla}', 'bn', now() - interval '24 hours'),

('twitter', 'Quant Trader BD', '@quant_bd', true, 'My algo detected unusual volume spike in LHBL today. 3.2x avg volume with price up 2.8%. Institutional accumulation pattern confirmed. Adding to watchlist. Historical pattern suggests 8-12% move within 2 weeks when this signal fires. #LHBL #QuantTrading', 'https://twitter.com/quant_bd/status/129', 267, 54, 78, '{LHBL}', 'positive', 0.87, 'analysis', '{quant,volume,algo}', 'en', now() - interval '26 hours');
