import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rss-proxy',
      configureServer(server) {
        server.middlewares.use('/api/rss', async (req, res) => {
          const target = new URL('http://x' + req.url).searchParams.get('url')
          if (!target) { res.statusCode = 400; res.end('Missing url'); return }

          try {
            const response = await fetch(target, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
                'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
              },
              redirect: 'follow',
              signal: AbortSignal.timeout(12000),
            })

            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Content-Type', response.headers.get('content-type') || 'application/xml')
            res.statusCode = response.status

            const buf = await response.arrayBuffer()
            res.end(Buffer.from(buf))
          } catch (e) {
            res.statusCode = 502
            res.end('Proxy error: ' + e.message)
          }
        })
      },
    },
  ],
})
