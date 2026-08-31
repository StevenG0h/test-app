/**
 * Tiny mock "waiting room" backend for local testing.
 *
 * Run with:  npm run mock   (starts on http://localhost:8787)
 *
 * Endpoints (mirror what a real waiting-room service would do):
 *   GET  /api/session/validate  -> 200 {active:true} if the session cookie is
 *                                  present, otherwise 401
 *   GET  /api/session/revoke    -> clears the session cookie, 200
 *   GET  /api/session/grant     -> sets a session cookie and redirects back to
 *                                  the app (use from the waiting-room page)
 *   GET  /waiting-room          -> standalone "waiting room" page (optional;
 *                                  the app now shows its own in-app waiting
 *                                  room instead of redirecting here)
 *
 * It sends CORS headers so the Vite dev server (a different origin on
 * localhost) can call it with credentials.
 */
import http from 'node:http'

const PORT = Number(process.env.MOCK_PORT ?? 8787)
const COOKIE_NAME = process.env.SESSION_COOKIE ?? 'session'
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  // CORS: allow the app origin to read responses and send cookies.
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const hasCookie = (req.headers.cookie ?? '')
    .split(';')
    .some((c) => c.trim().startsWith(`${COOKIE_NAME}=`))

  if (url.pathname === '/api/session/validate' && req.method === 'GET') {
    if (hasCookie) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ active: true }))
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ active: false }))
    }
    return
  }

  if (url.pathname === '/api/session/revoke' && (req.method === 'GET' || req.method === 'POST')) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`,
    })
    res.end(JSON.stringify({ revoked: true }))
    return
  }

  if (url.pathname === '/api/session/grant' && req.method === 'GET') {
    res.writeHead(302, {
      Location: `${APP_URL}/`,
      'Set-Cookie': `${COOKIE_NAME}=granted-${Date.now()}; Path=/; Max-Age=3600; SameSite=Lax`,
    })
    res.end()
    return
  }

  if (url.pathname === '/waiting-room') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Waiting Room (mock)</title></head>
  <body style="font-family:system-ui;text-align:center;padding-top:10vh">
    <h1>You are in the waiting room</h1>
    <p>Your session was missing or invalid, so you were redirected here.</p>
    <p><a href="/api/session/grant">Grant a session and go back to the app</a></p>
  </body>
</html>`)
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`Mock waiting room server listening on http://localhost:${PORT}`)
  console.log(`  App URL:        ${APP_URL}`)
  console.log(`  Validate:       GET  /api/session/validate`)
  console.log(`  Revoke:         GET  /api/session/revoke`)
  console.log(`  Grant:          GET  /api/session/grant`)
  console.log(`  Waiting room:   GET  /waiting-room`)
})
