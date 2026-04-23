import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  published: string;
  category: 'global' | 'capital' | 'ai' | 'commodity' | 'dse';
}

function proxyUrl(url: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

interface FeedConfig {
  url: string;
  source: string;
  category: NewsItem['category'];
}

const NEWS_FEEDS: FeedConfig[] = [
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', source: 'Yahoo Finance', category: 'global' },
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F,CL=F&region=US&lang=en-US', source: 'Yahoo Finance', category: 'commodity' },
  { url: 'https://news.google.com/rss/search?q=artificial+intelligence+investment+stock+market&hl=en-US&gl=US&ceid=US:en', source: 'Google News', category: 'ai' },
  { url: 'https://news.google.com/rss/search?q=Dhaka+Stock+Exchange+DSE+Bangladesh+market&hl=en&gl=BD&ceid=BD:en', source: 'Google News', category: 'dse' },
  { url: 'https://news.google.com/rss/search?q=capital+market+bond+treasury+money+market+finance&hl=en-US&gl=US&ceid=US:en', source: 'Google News', category: 'capital' },
];

function extractSource(title: string): { cleanTitle: string; source: string } {
  // Google News titles end with " - SourceName"
  const match = title.match(/^(.+?)\s+-\s+([^-]+)$/);
  if (match) return { cleanTitle: match[1].trim(), source: match[2].trim() };
  return { cleanTitle: title, source: '' };
}

function parseRSSItems(xmlText: string, defaultSource: string, category: NewsItem['category']): NewsItem[] {
  const items: NewsItem[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      // Try parsing as HTML fallback (some proxies return text/html)
      const htmlDoc = parser.parseFromString(xmlText, 'text/html');
      const htmlItems = htmlDoc.querySelectorAll('item');
      if (htmlItems.length === 0) return [];
    }

    const entries = doc.querySelectorAll('item');

    entries.forEach((item, i) => {
      if (i >= 6) return;
      const rawTitle = item.querySelector('title')?.textContent?.trim() || '';
      const link = item.querySelector('link')?.textContent?.trim() || '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';

      if (!rawTitle || !link) return;

      const { cleanTitle, source: extractedSource } = extractSource(rawTitle);

      items.push({
        title: cleanTitle,
        link,
        source: extractedSource || defaultSource,
        published: pubDate,
        category,
      });
    });
  } catch {
    // Regex fallback for malformed XML
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/g;
    const linkRegex = /<link>(.*?)<\/link>/g;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/g;

    const titles: string[] = [];
    const links: string[] = [];
    const dates: string[] = [];

    let m;
    while ((m = titleRegex.exec(xmlText)) !== null) titles.push(m[1] || m[2] || '');
    while ((m = linkRegex.exec(xmlText)) !== null) links.push(m[1] || '');
    while ((m = pubDateRegex.exec(xmlText)) !== null) dates.push(m[1] || '');

    // Skip the first title/link (channel-level)
    for (let i = 1; i < Math.min(titles.length, 7); i++) {
      const rawTitle = titles[i];
      if (!rawTitle) continue;
      const { cleanTitle, source: extractedSource } = extractSource(rawTitle);
      items.push({
        title: cleanTitle,
        link: links[i] || '',
        source: extractedSource || defaultSource,
        published: dates[i - 1] || '',
        category,
      });
    }
  }

  return items;
}

async function fetchIngestedNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('news_items')
      .select('title, link, source, published_at, category')
      .order('published_at', { ascending: false })
      .limit(30);
    if (error || !data) return [];
    return data.map((row: any) => ({
      title: row.title,
      link: row.link || '',
      source: row.source || 'Email',
      published: row.published_at || '',
      category: (row.category || 'capital') as NewsItem['category'],
    }));
  } catch {
    return [];
  }
}

async function fetchAllNews(): Promise<NewsItem[]> {
  const rssPromise = Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      try {
        const url = proxyUrl(feed.url);
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return [];
        const text = await res.text();
        if (!text || text.length < 100) return [];
        return parseRSSItems(text, feed.source, feed.category);
      } catch {
        return [];
      }
    })
  );

  const [results, ingested] = await Promise.all([rssPromise, fetchIngestedNews()]);

  const allNews: NewsItem[] = [...ingested];
  for (const r of results) {
    if (r.status === 'fulfilled') allNews.push(...r.value);
  }

  // Sort by published date (newest first)
  allNews.sort((a, b) => {
    const da = a.published ? new Date(a.published).getTime() : 0;
    const db = b.published ? new Date(b.published).getTime() : 0;
    if (isNaN(da) && isNaN(db)) return 0;
    if (isNaN(da)) return 1;
    if (isNaN(db)) return -1;
    return db - da;
  });

  return allNews;
}

export function useMarketNews() {
  return useQuery<NewsItem[]>({
    queryKey: ['marketNews'],
    queryFn: fetchAllNews,
    refetchInterval: 300_000,
    staleTime: 120_000,
    retry: 2,
  });
}
