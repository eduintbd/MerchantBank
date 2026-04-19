export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Only allow Yahoo Finance and Google News domains
  const allowed = [
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com',
    'feeds.finance.yahoo.com',
    'news.google.com',
  ];

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!allowed.includes(parsed.hostname)) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const body = await upstream.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', contentType);
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({ error: 'Upstream fetch failed', message: err.message });
  }
}
