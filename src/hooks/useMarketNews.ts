import { useQuery } from '@tanstack/react-query';

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  published: string;
  category: 'global' | 'capital' | 'ai' | 'commodity' | 'dse';
}

const CORS_PROXY = 'https://corsproxy.io/?url=';

interface FeedConfig {
  url: string;
  source: string;
  category: NewsItem['category'];
}

const NEWS_FEEDS: FeedConfig[] = [
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', source: 'Yahoo Finance', category: 'global' },
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F,CL=F&region=US&lang=en-US', source: 'Yahoo Finance', category: 'commodity' },
  { url: 'https://news.google.com/rss/search?q=artificial+intelligence+investment+stock+market&hl=en-US&gl=US&ceid=US:en', source: 'Google News', category: 'ai' },
  { url: 'https://news.google.com/rss/search?q=Dhaka+Stock+Exchange+DSE+Bangladesh&hl=en&gl=BD&ceid=BD:en', source: 'Google News', category: 'dse' },
  { url: 'https://news.google.com/rss/search?q=capital+market+bond+treasury+money+market&hl=en-US&gl=US&ceid=US:en', source: 'Google News', category: 'capital' },
];

function parseRSSItems(xml: string, source: string, category: NewsItem['category']): NewsItem[] {
  const items: NewsItem[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const entries = doc.querySelectorAll('item');

  entries.forEach((item, i) => {
    if (i >= 5) return; // max 5 per feed
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';

    if (title && link) {
      // Clean Google News titles (remove " - Source" suffix)
      const cleanTitle = title.replace(/\s*-\s*[^-]+$/, '').trim();
      items.push({
        title: cleanTitle || title,
        link,
        source,
        published: pubDate,
        category,
      });
    }
  });
  return items;
}

async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      const url = `${CORS_PROXY}${encodeURIComponent(feed.url)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseRSSItems(xml, feed.source, feed.category);
    })
  );

  const allNews: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allNews.push(...r.value);
  }

  // Sort by published date (newest first)
  allNews.sort((a, b) => {
    const da = a.published ? new Date(a.published).getTime() : 0;
    const db = b.published ? new Date(b.published).getTime() : 0;
    return db - da;
  });

  return allNews;
}

export function useMarketNews() {
  return useQuery<NewsItem[]>({
    queryKey: ['marketNews'],
    queryFn: fetchAllNews,
    refetchInterval: 300_000,
    staleTime: 180_000,
    retry: 1,
  });
}
