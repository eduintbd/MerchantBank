// Supabase Edge Function: scan-social-media
// Scrapes Bangladesh capital market news from business news sites + social media
// Sources: The Daily Star, Financial Express BD, DSE news, Reddit, Twitter, YouTube
//
// Deploy: supabase functions deploy scan-social-media
// Manual trigger: curl -X POST https://fnwmvopralrpvryncxdc.supabase.co/functions/v1/scan-social-media

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

const DSE_KEYWORDS = [
  'DSE', 'DSEX', 'DSES', 'DS30', 'CSE', 'CASPI', 'Dhaka Stock', 'Chittagong Stock',
  'Bangladesh stock', 'পুঁজিবাজার', 'শেয়ার বাজার', 'ঢাকা স্টক', 'capital market',
  'BSEC', 'SEC Bangladesh', 'stock exchange', 'share market', 'turnover', 'IPO',
];

const POPULAR_SYMBOLS = [
  'GP', 'BATBC', 'SQURPHARMA', 'BXPHARMA', 'BRACBANK', 'DUTCHBANGLA',
  'EBL', 'ICB', 'LHBL', 'MARICO', 'UPGDCL', 'WALTONHIL', 'BEXIMCO',
  'RENATA', 'BERGERPBL', 'OLYMPIC', 'POWERGRID', 'ISLAMIBANK', 'CITYBANK',
  'JANATAINS', 'LANKABAFIN', 'PUBALIBANK', 'PRIMEBANK', 'RUPALIBANK',
  'SQURCERAMICS', 'PREMIERCEM', 'HEIDELBCEM', 'MEGHNACEM', 'CONFIDCEM',
];

function detectSymbols(text: string): string[] {
  const upper = text.toUpperCase();
  return POPULAR_SYMBOLS.filter(s => upper.includes(s));
}

function detectLanguage(text: string): string {
  return /[\u0980-\u09FF]/.test(text) ? 'bn' : 'en';
}

function analyzeSentiment(text: string): string {
  const lower = text.toLowerCase();
  const positiveWords = ['rally', 'up', 'gain', 'bull', 'growth', 'surge', 'profit', 'buy', 'strong', 'high', 'positive', 'approved', 'dividend', 'opportunity', 'rise', 'record', 'best', 'recovery', 'boost', 'uptrend'];
  const negativeWords = ['crash', 'down', 'loss', 'bear', 'fall', 'sell', 'drop', 'decline', 'weak', 'low', 'negative', 'correction', 'risk', 'warning', 'volatile', 'plunge', 'slump', 'worst', 'concern', 'crisis'];
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
  if (lower.includes('breaking') || lower.includes('exclusive') || lower.includes('just in')) return 'breaking';
  if (lower.includes('ipo') || lower.includes('subscription') || lower.includes('public offer')) return 'ipo';
  if (lower.includes('bsec') || lower.includes('regulation') || lower.includes('circular') || lower.includes('policy')) return 'regulation';
  if (lower.includes('dsex') || lower.includes('market') || lower.includes('turnover') || lower.includes('index') || lower.includes('volume')) return 'market';
  if (lower.includes('analysis') || lower.includes('technical') || lower.includes('valuation') || lower.includes('forecast')) return 'analysis';
  if (lower.includes('dividend') || lower.includes('earning') || lower.includes('revenue') || lower.includes('eps') || lower.includes('profit')) return 'stock';
  if (lower.includes('think') || lower.includes('opinion') || lower.includes('believe') || lower.includes('outlook')) return 'opinion';
  return 'market';
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ─── The Daily Star Business ───
async function scrapeDailyStar(): Promise<ScrapedPost[]> {
  try {
    // Daily Star may block — try multiple URLs
    const urls = [
      'https://www.thedailystar.net/business/economy/stock',
      'https://www.thedailystar.net/business/economy',
    ];
    let html = '';
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: HEADERS });
        if (res.ok) { html = await res.text(); break; }
      } catch { /* try next */ }
    }
    if (!html) return [];
    const posts: ScrapedPost[] = [];

    // Generic: find all <a href="...">...<h2|h3>TITLE</h2|h3>...</a> or <h2|h3><a href>TITLE</a></h3>
    const patterns = [
      /<a[^>]*href="([^"]*\/business\/[^"]+)"[^>]*>[\s\S]*?<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi,
      /<h[23][^>]*>\s*<a[^>]*href="([^"]*\/business\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    ];
    const seen = new Set<string>();

    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(html)) !== null && posts.length < 15) {
        const url = match[1].startsWith('http') ? match[1] : `https://www.thedailystar.net${match[1]}`;
        const title = match[2].replace(/<[^>]+>/g, '').trim();
        if (!title || title.length < 15 || seen.has(title)) continue;
        seen.add(title);

        posts.push({
          platform: 'news',
          external_id: `tds_${btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`,
          author_name: 'The Daily Star',
          author_handle: 'thedailystar',
          author_verified: true,
          content: title,
          post_url: url,
          likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0,
          symbols: detectSymbols(title),
          sentiment: 'neutral',
          relevance_score: 0.8,
          category: 'market',
          tags: ['news', 'daily-star'],
          language: detectLanguage(title),
          posted_at: new Date().toISOString(),
        });
      }
    }
    return posts;
  } catch (err) {
    console.error('Daily Star error:', err);
    return [];
  }
}

// ─── Financial Express BD ───
async function scrapeFinancialExpress(): Promise<ScrapedPost[]> {
  try {
    const res = await fetch('https://thefinancialexpress.com.bd/stock', { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    const posts: ScrapedPost[] = [];

    // Pattern: <a href="/stock/slug"><h3>Title</h3></a>
    const patterns = [
      /<a[^>]*href="(\/stock\/[^"]+)"[^>]*>[\s\S]*?<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi,
      /<h[234][^>]*>\s*<a[^>]*href="(\/stock\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      /<a[^>]*href="(https:\/\/thefinancialexpress\.com\.bd\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    ];
    const seen = new Set<string>();

    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(html)) !== null && posts.length < 15) {
        const rawUrl = match[1];
        const url = rawUrl.startsWith('http') ? rawUrl : `https://thefinancialexpress.com.bd${rawUrl}`;
        const title = match[2].replace(/<[^>]+>/g, '').trim();
        if (!title || title.length < 15 || seen.has(title)) continue;
        seen.add(title);

        posts.push({
          platform: 'news',
          external_id: `fe_${btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`,
          author_name: 'Financial Express',
          author_handle: 'financialexpress',
          author_verified: true,
          content: title,
          post_url: url,
          likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0,
          symbols: detectSymbols(title),
          sentiment: 'neutral',
          relevance_score: 0.8,
          category: 'market',
          tags: ['news', 'financial-express'],
          language: detectLanguage(title),
          posted_at: new Date().toISOString(),
        });
      }
    }
    return posts;
  } catch (err) {
    console.error('Financial Express error:', err);
    return [];
  }
}

// ─── Dhaka Tribune Business ───
async function scrapeDhakaTribune(): Promise<ScrapedPost[]> {
  try {
    const res = await fetch('https://www.dhakatribune.com/business', { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    const posts: ScrapedPost[] = [];

    // Pattern: <a href="//www.dhakatribune.com/business/...">Title</a>
    const patterns = [
      /<a[^>]*href="(?:https?:)?\/\/www\.dhakatribune\.com\/(business\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      /<h[234][^>]*>\s*<a[^>]*href="([^"]*business[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    ];
    const seen = new Set<string>();

    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(html)) !== null && posts.length < 15) {
        const rawUrl = match[1];
        const url = rawUrl.startsWith('http') ? rawUrl : `https://www.dhakatribune.com/${rawUrl}`;
        const title = match[2].replace(/<[^>]+>/g, '').trim();
        if (!title || title.length < 15 || seen.has(title)) continue;
        seen.add(title);

        posts.push({
          platform: 'news',
          external_id: `dt_${btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`,
          author_name: 'Dhaka Tribune',
          author_handle: 'dhakatribune',
          author_verified: true,
          content: title,
          post_url: url,
          likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0,
          symbols: detectSymbols(title),
          sentiment: 'neutral',
          relevance_score: 0.75,
          category: 'market',
          tags: ['news', 'dhaka-tribune'],
          language: detectLanguage(title),
          posted_at: new Date().toISOString(),
        });
      }
    }
    return posts;
  } catch (err) {
    console.error('Dhaka Tribune error:', err);
    return [];
  }
}

// ─── DSE BD Official News ───
async function scrapeDSENews(): Promise<ScrapedPost[]> {
  try {
    const res = await fetch('https://www.dsebd.org/', { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    const posts: ScrapedPost[] = [];

    // Extract news/announcements from DSE homepage
    const newsRegex = /<a[^>]*href="([^"]*(?:news|announcement|circular|notice)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const seen = new Set<string>();
    let match;

    while ((match = newsRegex.exec(html)) !== null && posts.length < 10) {
      const url = match[1].startsWith('http') ? match[1] : `https://www.dsebd.org/${match[1]}`;
      const title = match[2].replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
      if (!title || title.length < 10 || seen.has(title)) continue;
      seen.add(title);

      posts.push({
        platform: 'news',
        external_id: `dse_${btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`,
        author_name: 'Dhaka Stock Exchange',
        author_handle: 'dsebd',
        author_verified: true,
        content: title,
        post_url: url,
        likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0,
        symbols: detectSymbols(title),
        sentiment: 'neutral',
        relevance_score: 0.9,
        category: 'regulation',
        tags: ['official', 'dse'],
        language: detectLanguage(title),
        posted_at: new Date().toISOString(),
      });
    }
    return posts;
  } catch (err) {
    console.error('DSE BD error:', err);
    return [];
  }
}

// ─── Prothom Alo Business (Bangla) ───
async function scrapeProthomAlo(): Promise<ScrapedPost[]> {
  try {
    const res = await fetch('https://www.prothomalo.com/business', { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    const posts: ScrapedPost[] = [];

    const articleRegex = /<h[234][^>]*>\s*<a[^>]*href="(https:\/\/www\.prothomalo\.com\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const seen = new Set<string>();
    let match;

    while ((match = articleRegex.exec(html)) !== null && posts.length < 10) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      if (!title || title.length < 10 || seen.has(title)) continue;
      seen.add(title);

      const isRelevant = DSE_KEYWORDS.some(k => title.toLowerCase().includes(k.toLowerCase())) ||
        title.includes('পুঁজিবাজার') || title.includes('শেয়ার') || title.includes('স্টক') ||
        title.toLowerCase().includes('stock') || title.toLowerCase().includes('market');
      if (!isRelevant) continue;

      posts.push({
        platform: 'news',
        external_id: `pa_${btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`,
        author_name: 'প্রথম আলো',
        author_handle: 'prabortonalo',
        author_verified: true,
        content: title,
        post_url: url,
        likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0,
        symbols: detectSymbols(title),
        sentiment: 'neutral',
        relevance_score: 0.75,
        category: 'market',
        tags: ['news', 'prothom-alo', 'bangla'],
        language: 'bn',
        posted_at: new Date().toISOString(),
      });
    }
    return posts;
  } catch (err) {
    console.error('Prothom Alo error:', err);
    return [];
  }
}

// ─── Reddit (no API key needed) ───
async function scrapeReddit(): Promise<ScrapedPost[]> {
  try {
    const subreddits = ['BangladeshStocks', 'DhakaStockExchange', 'bangladesh'];
    const posts: ScrapedPost[] = [];

    for (const sub of subreddits) {
      try {
        const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
          headers: { 'User-Agent': 'Abaci/1.0' },
        });
        if (!res.ok) continue;
        const data = await res.json();

        for (const child of (data.data?.children || [])) {
          const p = child.data;
          const text = p.selftext ? `${p.title}\n\n${p.selftext.slice(0, 400)}` : p.title;
          const isRelevant = DSE_KEYWORDS.some(k => text.toLowerCase().includes(k.toLowerCase())) || detectSymbols(text).length > 0;
          if (!isRelevant) continue;

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
            shares_count: 0, views_count: 0,
            symbols: detectSymbols(text),
            sentiment: 'neutral',
            relevance_score: 0.7,
            category: 'general',
            tags: ['reddit', sub],
            language: detectLanguage(text),
            posted_at: new Date(p.created_utc * 1000).toISOString(),
          });
        }
      } catch { /* skip failed subreddit */ }
    }
    return posts;
  } catch (err) {
    console.error('Reddit error:', err);
    return [];
  }
}

// ─── Twitter/X (optional, needs bearer token) ───
async function scrapeTwitter(): Promise<ScrapedPost[]> {
  const TWITTER_BEARER = Deno.env.get('TWITTER_BEARER_TOKEN');
  if (!TWITTER_BEARER) return [];

  try {
    const query = encodeURIComponent('(DSE OR DSEX OR "Dhaka Stock" OR "Bangladesh stock" OR BSEC) -is:retweet lang:en');
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=20&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username,verified`,
      { headers: { Authorization: `Bearer ${TWITTER_BEARER}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const users = new Map((data.includes?.users || []).map((u: any) => [u.id, u]));

    return (data.data || []).map((t: any) => {
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
        tags: ['twitter'],
        language: detectLanguage(t.text),
        posted_at: t.created_at,
      };
    });
  } catch (err) {
    console.error('Twitter error:', err);
    return [];
  }
}

// ─── YouTube (optional, needs API key) ───
async function scrapeYouTube(): Promise<ScrapedPost[]> {
  const YT_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YT_KEY) return [];

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
      likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0,
      symbols: detectSymbols(item.snippet.title + ' ' + item.snippet.description),
      sentiment: 'neutral',
      relevance_score: 0.7,
      category: 'analysis',
      tags: ['video', 'youtube'],
      language: detectLanguage(item.snippet.title),
      posted_at: item.snippet.publishedAt,
    }));
  } catch (err) {
    console.error('YouTube error:', err);
    return [];
  }
}

// ─── Main handler ───
Deno.serve(async (_req) => {
  try {
    console.log('Starting capital market news scan...');

    // Scrape all sources in parallel — news sites first (no API keys needed)
    const [
      dailyStarPosts,
      financialExpressPosts,
      dhakaTribunePosts,
      dseNewsPosts,
      prothomAloPosts,
      redditPosts,
      twitterPosts,
      youtubePosts,
    ] = await Promise.all([
      scrapeDailyStar(),
      scrapeFinancialExpress(),
      scrapeDhakaTribune(),
      scrapeDSENews(),
      scrapeProthomAlo(),
      scrapeReddit(),
      scrapeTwitter(),
      scrapeYouTube(),
    ]);

    const allPosts = [
      ...dailyStarPosts,
      ...financialExpressPosts,
      ...dhakaTribunePosts,
      ...dseNewsPosts,
      ...prothomAloPosts,
      ...redditPosts,
      ...twitterPosts,
      ...youtubePosts,
    ];

    const sourceCounts = {
      daily_star: dailyStarPosts.length,
      financial_express: financialExpressPosts.length,
      dhaka_tribune: dhakaTribunePosts.length,
      dse_official: dseNewsPosts.length,
      prothom_alo: prothomAloPosts.length,
      reddit: redditPosts.length,
      twitter: twitterPosts.length,
      youtube: youtubePosts.length,
    };

    console.log(`Scraped ${allPosts.length} total posts:`, JSON.stringify(sourceCounts));

    if (allPosts.length === 0) {
      return new Response(JSON.stringify({ message: 'No new posts found', count: 0, sources: sourceCounts }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enrich with sentiment and category, then deduplicate by external_id
    const seenIds = new Set<string>();
    const enrichedPosts = allPosts
      .map(post => ({
        ...post,
        sentiment: analyzeSentiment(post.content),
        category: categorizePost(post.content),
        relevance_score: Math.min(0.99, post.relevance_score + (post.symbols.length * 0.05)),
        scraped_at: new Date().toISOString(),
      }))
      .filter(post => {
        const key = `${post.platform}_${post.external_id}`;
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      });

    // Upsert (dedup on platform + external_id)
    const BATCH = 50;
    let upsertCount = 0;
    let upsertError: string | null = null;

    for (let i = 0; i < enrichedPosts.length; i += BATCH) {
      const batch = enrichedPosts.slice(i, i + BATCH);
      const { error } = await supabase
        .from('social_media_posts')
        .upsert(batch, { onConflict: 'platform,external_id' });

      if (error) {
        upsertError = error.message;
        console.error('Upsert error:', error.message);
      } else {
        upsertCount += batch.length;
      }
    }

    console.log(`Upserted ${upsertCount} posts successfully`);

    return new Response(JSON.stringify({
      message: 'Scan complete',
      count: upsertCount,
      error: upsertError,
      sources: sourceCounts,
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
