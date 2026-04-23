import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method not allowed')
    return
  }

  const {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
    VITE_GOOGLE_CLIENT_ID: googleClientId,
    GOOGLE_CLIENT_SECRET: googleClientSecret,
    GOOGLE_OAUTH_REDIRECT_URI: redirectUri,
  } = process.env

  if (!supabaseUrl || !supabaseAnonKey || !googleClientId || !googleClientSecret || !redirectUri) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Server misconfigured' }))
    return
  }

  let body = req.body
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}') } catch { body = {} }
  }
  const { code, state } = body || {}
  if (!code || !state) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing code or state' })); return }

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

  const { data: stateRow, error: stateErr } = await supabase
    .from('gmail_oauth_states').select('user_id').eq('state', state).maybeSingle()
  if (stateErr) { res.statusCode = 500; res.end(JSON.stringify({ error: stateErr.message })); return }
  if (!stateRow || stateRow.user_id !== user.id) {
    res.statusCode = 403; res.end(JSON.stringify({ error: 'State mismatch' })); return
  }
  await supabase.from('gmail_oauth_states').delete().eq('state', state)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    res.statusCode = 502
    res.end(JSON.stringify({ error: 'Google token exchange failed', detail: text }))
    return
  }
  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'No refresh_token returned — revoke app access at https://myaccount.google.com/permissions and try again' }))
    return
  }

  // Get the connected account's email address
  const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  let connectedEmail = ''
  if (profileRes.ok) {
    try { connectedEmail = (await profileRes.json()).email || '' } catch { /* ignore */ }
  }

  const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
  const { error: upsertErr } = await supabase
    .from('gmail_connections')
    .upsert({
      user_id: user.id,
      email: connectedEmail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope || '',
      updated_at: new Date().toISOString(),
    })

  if (upsertErr) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: upsertErr.message }))
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify({ ok: true, email: connectedEmail }))
}
