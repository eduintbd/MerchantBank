import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { pathToFileURL } from 'url'

const ALLOWED_PROXY_HOSTS = new Set([
  'query1.finance.yahoo.com',
  'query2.finance.yahoo.com',
  'feeds.finance.yahoo.com',
  'news.google.com',
])

// Adapter to invoke Vercel-style `api/**.js` handlers from Vite dev middleware.
function adaptHandler(handler: (req: any, res: any) => any) {
  return async (req: any, res: any) => {
    try {
      const urlObj = new URL(req.url ?? '', 'http://x')
      req.query = Object.fromEntries(urlObj.searchParams.entries())
      if (!req.body && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const raw = Buffer.concat(chunks).toString('utf-8')
        try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = raw }
      }
      await handler(req, res)
    } catch (err: any) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
      }
      res.end(JSON.stringify({ error: 'Dev handler error', detail: err?.message ?? String(err) }))
    }
  }
}

function apiProxyPlugin(): Plugin {
  return {
    name: 'local-api-proxy',
    configResolved(config) {
      // Load .env into process.env so server-side handlers (which run in this
      // Node process during dev) can read GOOGLE_CLIENT_SECRET, etc. Vite
      // normally only exposes VITE_-prefixed vars to the client via import.meta.env.
      const env = loadEnv(config.mode, config.envDir ?? process.cwd(), '')
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v
      }
    },
    configureServer(server) {
      // RSS proxy (mirrors api/proxy.js in production)
      server.middlewares.use('/api/proxy', async (req, res) => {
        const urlParam = new URL(req.url ?? '', 'http://x').searchParams.get('url')
        if (!urlParam) { res.statusCode = 400; res.end('Missing url parameter'); return }
        let parsed: URL
        try { parsed = new URL(urlParam) } catch { res.statusCode = 400; res.end('Invalid URL'); return }
        if (!ALLOWED_PROXY_HOSTS.has(parsed.hostname)) { res.statusCode = 403; res.end('Domain not allowed'); return }
        try {
          const upstream = await fetch(urlParam, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          })
          const body = await upstream.text()
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.statusCode = upstream.status
          res.end(body)
        } catch (err: any) {
          res.statusCode = 502
          res.end(`Upstream fetch failed: ${err?.message ?? 'unknown'}`)
        }
      })

      // Route each /api/gmail/<name> to ./api/gmail/<name>.js
      const gmailRoutes = ['start', 'callback', 'exchange', 'sync']
      for (const name of gmailRoutes) {
        server.middlewares.use(`/api/gmail/${name}`, async (req, res) => {
          try {
            const filePath = path.resolve(__dirname, `./api/gmail/${name}.js`)
            const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`)
            await adaptHandler(mod.default)(req, res)
          } catch (err: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Route load failed', detail: err?.message ?? String(err) }))
          }
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'recharts': ['recharts'],
          'query': ['@tanstack/react-query'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'ui': ['lucide-react', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
