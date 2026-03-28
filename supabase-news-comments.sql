-- Comments on social media / news posts
-- Run in Main Supabase SQL Editor (fnwmvopralrpvryncxdc)

CREATE TABLE IF NOT EXISTS news_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES social_media_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_comments_post ON news_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_news_comments_user ON news_comments(user_id);

-- RLS
ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Public read news comments" ON news_comments FOR SELECT USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Auth insert news comments" ON news_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Own delete news comments" ON news_comments FOR DELETE
  USING (auth.uid() = user_id);
