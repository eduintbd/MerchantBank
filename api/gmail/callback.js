// Google redirects here after the admin grants Gmail access. We don't
// exchange the code server-side because the serverless function has no user
// session. Instead we serve a tiny HTML page that forwards control to the
// frontend, where the logged-in Supabase session will POST the code to
// /api/gmail/exchange with its JWT attached.
export default function handler(req, res) {
  const query = req.url && req.url.includes('?') ? req.url.split('?')[1] : ''
  const safeQuery = query.replace(/[<>"'&]/g, '')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.statusCode = 200
  res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Connecting Gmail…</title></head><body style="font-family:system-ui;padding:2rem;color:#444"><p>Finishing Gmail connection…</p><script>window.location.replace('/admin/news?' + ${JSON.stringify(safeQuery)});</script></body></html>`)
}
