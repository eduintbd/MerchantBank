import { createClient } from '@supabase/supabase-js'

const DEFAULT_QUERY = 'newer_than:30d (category:primary OR label:inbox)'
const MAX_MESSAGES = 40

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }

  const {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
    VITE_GOOGLE_CLIENT_ID: googleClientId,
    GOOGLE_CLIENT_SECRET: googleClientSecret,
  } = process.env

  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401; res.end(JSON.stringify({ error: 'Missing auth token' })); return
  }
  const jwt = authHeader.slice(7)

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !userData?.user) { res.statusCode = 401; res.end(JSON.stringify({ error: 'Invalid session' })); return }
  const user = userData.user

  let body = req.body
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}') } catch { body = {} }
  }
  const query = (body && typeof body.query === 'string' && body.query.trim()) ? body.query : DEFAULT_QUERY

  const { data: conn, error: connErr } = await supabase
    .from('gmail_connections').select('*').eq('user_id', user.id).maybeSingle()
  if (connErr) { res.statusCode = 500; res.end(JSON.stringify({ error: connErr.message })); return }
  if (!conn) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Gmail is not connected' })); return }

  // Refresh access token if expired (or within 60s of expiry).
  let accessToken = conn.access_token
  if (new Date(conn.expires_at).getTime() - Date.now() < 60_000) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: conn.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    if (!refreshRes.ok) {
      const text = await refreshRes.text()
      res.statusCode = 502; res.end(JSON.stringify({ error: 'Token refresh failed', detail: text })); return
    }
    const refreshed = await refreshRes.json()
    accessToken = refreshed.access_token
    const newExpiresAt = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString()
    await supabase.from('gmail_connections').update({
      access_token: accessToken,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)
  }

  const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
  listUrl.searchParams.set('q', query)
  listUrl.searchParams.set('maxResults', String(MAX_MESSAGES))
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!listRes.ok) {
    res.statusCode = 502; res.end(JSON.stringify({ error: 'Gmail list failed', detail: await listRes.text() })); return
  }
  const listData = await listRes.json()
  const messageIds = (listData.messages || []).map(m => m.id)

  const { data: existing } = await supabase
    .from('news_items').select('gmail_message_id').in('gmail_message_id', messageIds)
  const existingIds = new Set((existing || []).map(e => e.gmail_message_id))
  const newIds = messageIds.filter(id => !existingIds.has(id))

  const inserted = []
  for (const id of newIds) {
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!msgRes.ok) continue
    const msg = await msgRes.json()
    const headers = {}
    for (const h of (msg.payload?.headers || [])) {
      headers[h.name.toLowerCase()] = h.value
    }
    const subject = headers.subject || '(no subject)'
    const from = headers.from || ''
    const dateRaw = headers.date || ''
    const parsedDate = dateRaw ? new Date(dateRaw) : null
    const publishedAt = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString()
    const snippet = msg.snippet || ''

    const senderName = from.replace(/<[^>]+>/, '').replace(/"/g, '').trim() || from
    const link = `https://mail.google.com/mail/u/0/#inbox/${id}`

    inserted.push({
      title: subject,
      snippet,
      sender: senderName,
      source: 'Email',
      category: 'capital',
      link,
      published_at: publishedAt,
      gmail_message_id: id,
      ingested_by: user.id,
    })
  }

  let insertedCount = 0
  if (inserted.length > 0) {
    const { error: insErr, count } = await supabase
      .from('news_items').insert(inserted, { count: 'exact' })
    if (insErr) {
      res.statusCode = 500; res.end(JSON.stringify({ error: insErr.message })); return
    }
    insertedCount = count ?? inserted.length
  }

  await supabase.from('gmail_connections').update({
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify({
    ok: true,
    scanned: messageIds.length,
    inserted: insertedCount,
    query,
  }))
}
