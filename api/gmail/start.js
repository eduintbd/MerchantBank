import { createClient } from '@supabase/supabase-js'

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'].join(' ')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method not allowed')
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

  if (!supabaseUrl || !supabaseAnonKey || !googleClientId || !redirectUri) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Server misconfigured: missing env vars' }))
    return
  }

  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'Missing auth token' }))
    return
  }
  const jwt = authHeader.slice(7)

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !userData?.user) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'Invalid session' }))
    return
  }
  const user = userData.user

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    res.statusCode = 403
    res.end(JSON.stringify({ error: 'Admin access required' }))
    return
  }

  const { data: state, error: stateErr } = await supabase
    .from('gmail_oauth_states')
    .insert({ user_id: user.id })
    .select('state')
    .single()

  if (stateErr || !state) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Could not create OAuth state', detail: stateErr?.message }))
    return
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', googleClientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state.state)

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify({ url: authUrl.toString() }))
}
