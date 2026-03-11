// Supabase Edge Function: scan-social-media
// Runs every hour via cron to aggregate Bangladesh stock market posts
// from Twitter/X, Reddit, YouTube, Facebook, LinkedIn
//
// Deploy: supabase functions deploy scan-social-media
// Cron:   Set up in Supabase Dashboard > Database > Extensions > pg_cron
//         SELECT cron.schedule('scan-social-media', '0 * * * *',
//           $$SELECT net.http_post(
//             url := 'https://fnwmvopralrpvryncxdc.supabase.co/functions/v1/scan-social-media',
//             headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
//             body := '{}'::jsonb
//           );$$
//         );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Platform scrapers ───
// Each returns an array of posts in our schema format.
// Replace placeholder logic with real API calls.

interface ScrapedPost {
  platform: string;
  external_id: string;
  author_name: string;
  author_handle?: string;
  author_verified: boolean;
  content: string;
  media_url?: string;
  post_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  symbols: string[];
  sentiment: string;
  relevance_score: number;
  category: string;
  tags: string[];
  language: string;
  posted_at: string;
}

// DSE stock symbols for keyword matching
const DSE_KEYWORDS = [
  'DSE', 'DSEX', 'DSES', 'DS30', 'CSE', 'Dhaka Stock', 'Bangladesh stock',
  'পুঁজিবাজার', 'শেয়ার বাজার', 'ঢাকা স্টক',
  'BSEC', 'SEC Bangladesh',
];

const POPULAR_SYMBOLS = [
  'GP', 'BATBC', 'SQURPHARMA', 'BXPHARMA', 'BRACBANK', 'DUTCHBANGLA',
  'EBL', 'ICB', 'LHBL', 'MARICO', 'UPGDCL', 'WALTONHIL', 'BEXIMCO',
  'RENATA', 'BERGERPBL', 'OLYMPIC', 'POWERGRID', 'ISLAMIBANK',
];

function detectSymbols(text: string): string[] {
  const upper = text.toUpperCase();
  return POPULAR_SYMBOLS.filter(s => upper.includes(s));
}

function detectLanguage(text: string): string {
  // Simple Bengali detection via Unicode range
  return /[\u0980-\u09FF]/.test(text) ? 'bn' : 'en';
}

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return DSE_KEYWORDS.some(k => lower.includes(k.toLowerCase())) || detectSymbols(text).length > 0;
}

// ─── Twitter/X via API (requires Bearer token) ───
async function scrapeTwitter(): Promise<ScrapedPost[]> {
  const TWITTER_BEARER = Deno.env.get('TWITTER_BEARER_TOKEN');
  if (!TWITTER_BEARER) {
    console.log('TWITTER_BEARER_TOKEN not set, skipping Twitter');
    return [];
  }

  try {
    // Search recent tweets about DSE/Bangladesh stocks
    const query = encodeURIComponent('(DSE OR DSEX OR "Dhaka Stock" OR "Bangladesh stock" OR BSEC) -is:retweet lang:en');
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=20&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username,verified`,
      { headers: { Authorization: `Bearer ${TWITTER_BEARER}` } }
    );

    if (!res.ok) {
      console.error('Twitter API error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const users = new Map((data.includes?.users || []).map((u: any) => [u.id, u]));

    return (data.data || [])
      .filter((t: any) => isRelevant(t.text))
      .map((t: any) => {
        const author = users.get(t.author_id) || {};
        const metrics = t.public_metrics || {};
        return {
          platform: 'twitter',
          external_id: t.id,
          author_name: author.name || 'Unknown',
          author_handle: author.username ? `@${author.username}` : undefined,
          author_verified: author.verified || false,
          content: t.text,
          post_url: `https://twitter.com/${author.username}/status/${t.id}`,
          likes_count: metrics.like_count || 0,
          comments_count: metrics.reply_count || 0,
          shares_count: metrics.retweet_count || 0,
          views_count: metrics.impression_count || 0,
          symbols: detectSymbols(t.text),
          sentiment: 'neutral',
          relevance_score: 0.7,
          category: 'general',
          tags: [],
          language: detectLanguage(t.text),
          posted_at: t.created_at,
        };
      });
  } catch (err) {
    console.error('Twitter scrape error:', err);
    return [];
  }
}

// ─── Reddit via public JSON API ───
async function scrapeReddit(): Promise<ScrapedPost[]> {
  try {
    const subreddits = ['BangladeshStocks', 'DhakaStockExchange', 'bangladesh'];
    const posts: ScrapedPost[] = [];

    for (const sub of subreddits) {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
        headers: { 'User-Agent': 'HeroStock/1.0' },
      });

      if (!res.ok) continue;
      const data = await res.json();

      for (const child of (data.data?.children || [])) {
        const p = child.data;
        if (!isRelevant(p.title + ' ' + (p.selftext || ''))) continue;
        const text = p.selftext ? `${p.title}\n\n${p.selftext.slice(0, 500)}` : p.title;

        posts.push({
          platform: 'reddit',
          external_id: p.id,
          author_name: `u/${p.author}`,
          author_handle: p.author,
          author_verified: false,
          content: text,
          post_url: `https://reddit.com${p.permalink}`,
          likes_count: p.ups || 0,
          comments_count: p.num_comments || 0,
          shares_count: 0,
          views_count: 0,
          symbols: detectSymbols(text),
          sentiment: 'neutral',
          relevance_score: 0.7,
          category: 'general',
          tags: [],
          language: detectLanguage(text),
          posted_at: new Date(p.created_utc * 1000).toISOString(),
        });
      }
    }

    return posts;
  } catch (err) {
    console.error('Reddit scrape error:', err);
    return [];
  }
}

// ─── YouTube via Data API v3 ───
async function scrapeYouTube(): Promise<ScrapedPost[]> {
  const YT_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YT_KEY) {
    console.log('YOUTUBE_API_KEY not set, skipping YouTube');
    return [];
  }

  try {
    const query = encodeURIComponent('DSE Bangladesh stock market');
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=10&order=date&key=${YT_KEY}`
    );

    if (!res.ok) return [];
    const data = await res.json();

    return (data.items || []).map((item: any) => ({
      platform: 'youtube',
      external_id: item.id.videoId,
      author_name: item.snippet.channelTitle,
      author_handle: item.snippet.channelTitle,
      author_verified: false,
      content: item.snippet.title + (item.snippet.description ? `\n\n${item.snippet.description.slice(0, 300)}` : ''),
      media_url: item.snippet.thumbnails?.high?.url,
      post_url: `https://youtube.com/watch?v=${item.id.videoId}`,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      symbols: detectSymbols(item.snippet.title + ' ' + item.snippet.description),
      sentiment: 'neutral',
      relevance_score: 0.7,
      category: 'analysis',
      tags: ['video'],
      language: detectLanguage(item.snippet.title),
      posted_at: item.snippet.publishedAt,
    }));
  } catch (err) {
    console.error('YouTube scrape error:', err);
    return [];
  }
}

// ─── Simple sentiment analysis ───
function analyzeSentiment(text: string): string {
  const lower = text.toLowerCase();
  const positiveWords = ['rally', 'up', 'gain', 'bull', 'growth', 'surge', 'profit', 'buy', 'strong', 'high', 'positive', 'prequalification', 'approved', 'dividend', 'opportunity'];
  const negativeWords = ['crash', 'down', 'loss', 'bear', 'fall', 'sell', 'drop', 'decline', 'weak', 'low', 'negative', 'correction', 'risk', 'warning', 'volatile'];

  let pos = 0, neg = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) pos++; });
  negativeWords.forEach(w => { if (lower.includes(w)) neg++; });

  if (pos > neg + 1) return 'positive';
  if (neg > pos + 1) return 'negative';
  if (pos > 0 && neg > 0) return 'mixed';
  return 'neutral';
}

function categorizePost(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('breaking') || lower.includes('exclusive')) return 'breaking';
  if (lower.includes('ipo') || lower.includes('subscription')) return 'ipo';
  if (lower.includes('bsec') || lower.includes('regulation') || lower.includes('circular')) return 'regulation';
  if (lower.includes('dsex') || lower.includes('market') || lower.includes('turnover') || lower.includes('index')) return 'market';
  if (lower.includes('analysis') || lower.includes('technical') || lower.includes('dd:') || lower.includes('valuation')) return 'analysis';
  if (lower.includes('dividend') || lower.includes('earning') || lower.includes('revenue')) return 'stock';
  if (lower.includes('think') || lower.includes('opinion') || lower.includes('believe')) return 'opinion';
  return 'general';
}

// ─── Main handler ───
Deno.serve(async (req) => {
  try {
    console.log('Starting social media scan...');

    // Scrape all platforms in parallel
    const [twitterPosts, redditPosts, youtubePosts] = await Promise.all([
      scrapeTwitter(),
      scrapeReddit(),
      scrapeYouTube(),
    ]);

    const allPosts = [...twitterPosts, ...redditPosts, ...youtubePosts];
    console.log(`Scraped ${allPosts.length} total posts`);

    if (allPosts.length === 0) {
      return new Response(JSON.stringify({ message: 'No new posts found', count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enrich with sentiment and category
    const enrichedPosts = allPosts.map(post => ({
      ...post,
      sentiment: analyzeSentiment(post.content),
      category: categorizePost(post.content),
      relevance_score: Math.min(0.99, 0.5 + (post.symbols.length * 0.1) + (post.likes_count > 100 ? 0.1 : 0) + (post.comments_count > 20 ? 0.05 : 0)),
    }));

    // Upsert into database (dedup on platform + external_id)
    const { data, error } = await supabase
      .from('social_media_posts')
      .upsert(
        enrichedPosts.map(p => ({
          platform: p.platform,
          external_id: p.external_id,
          author_name: p.author_name,
          author_handle: p.author_handle,
          author_verified: p.author_verified,
          content: p.content,
          media_url: p.media_url,
          post_url: p.post_url,
          likes_count: p.likes_count,
          comments_count: p.comments_count,
          shares_count: p.shares_count,
          views_count: p.views_count,
          symbols: p.symbols,
          sentiment: p.sentiment,
          relevance_score: p.relevance_score,
          category: p.category,
          tags: p.tags,
          language: p.language,
          posted_at: p.posted_at,
          scraped_at: new Date().toISOString(),
        })),
        { onConflict: 'platform,external_id' }
      );

    if (error) {
      console.error('Upsert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Upserted ${enrichedPosts.length} posts successfully`);

    return new Response(JSON.stringify({
      message: 'Scan complete',
      count: enrichedPosts.length,
      platforms: {
        twitter: twitterPosts.length,
        reddit: redditPosts.length,
        youtube: youtubePosts.length,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Scan error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
