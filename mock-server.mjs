/**
 * Tiny mock "waiting room" backend for local testing.
 *
 * Run with:  npm run mock   (starts on http://localhost:8787)
 *
 * Endpoints (mirror the Go/Fiber waiting-room backend):
 *   POST /api/token/request                  -> 200 {token, session} pass-through
 *                                              -> 200 {message}      joined the queue
 *                                              -> 200 {token}        existing session
 *   GET  /api/token/validate?token=...       -> 200 {message} valid | 400 invalid/expired
 *   GET  /api/token/invalidate?token=...&userId=... -> 200 | 400 invalid/expired
 *   GET  /api/token/grant                    -> grants a token for the session
 *                                              (lets you in) and sets the cookie
 *   GET  /waiting-room                       -> standalone "waiting room" page
 *
 * By default the first token request joins the queue. Set MOCK_PASS_THROUGH=1
 * to make it pass straight through instead. Use /api/token/grant to get a
 * token while waiting in the queue.
 *
 * It sends CORS headers so the Vite dev server (a different origin on
 * localhost) can call it with credentials.
 */
import crypto from 'node:crypto'
import http from 'node:http'

const PORT = Number(process.env.MOCK_PORT ?? 8787)
const COOKIE_NAME = process.env.SESSION_COOKIE ?? 'session'
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const PASS_THROUGH = process.env.MOCK_PASS_THROUGH === '1'

// In-memory tokens, keyed by user id. A user is in the queue until a token is
// granted (valid = true).
const tokens = new Map()

function getSessionUserId(req) {
  const cookie = (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
  return cookie ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)) : null
}

function sendJson(res, status, body, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...extra })
  res.end(JSON.stringify(body))
}

function setSessionCookie(res, userId) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(userId)}; Path=/; Max-Age=3600; SameSite=Lax`,
  )
}

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

  const userId = getSessionUserId(req)

  // POST /api/token/request — the waiting-room entry point.
  if (url.pathname === '/api/token/request' && req.method === 'POST') {
    if (!userId) {
      // First visit: either pass straight through or join the queue.
      const id = crypto.randomUUID()
      if (PASS_THROUGH) {
        const record = { token: `tok-${id}`, valid: true }
        tokens.set(id, record)
        setSessionCookie(res, id)
        sendJson(res, 200, { token: record.token, session: id })
      } else {
        tokens.set(id, { token: null, valid: false })
        setSessionCookie(res, id)
        sendJson(res, 200, { message: 'User has joined the queue please wait' })
      }
      return
    }

    // Returning visitor: hand back the token if one has been granted.
    const record = tokens.get(userId)
    if (record?.token && record.valid) {
      sendJson(res, 200, { token: record.token })
    } else {
      sendJson(res, 200, { message: 'User has joined the queue please wait' })
    }
    return
  }

  // GET /api/token/validate?token=... — checks the token is valid.
  if (url.pathname === '/api/token/validate' && req.method === 'GET') {
    const token = url.searchParams.get('token')
    const record = userId ? tokens.get(userId) : undefined
    if (!token || !record || record.token !== token || !record.valid) {
      sendJson(res, 400, { message: 'Invalid or expired token' })
    } else {
      sendJson(res, 200, { message: 'Token is valid' })
    }
    return
  }

  // GET /api/token/invalidate?token=...&userId=... — invalidates the token.
  if (url.pathname === '/api/token/invalidate' && req.method === 'GET') {
    const token = url.searchParams.get('token')
    const targetId = url.searchParams.get('userId') ?? userId
    const record = targetId ? tokens.get(targetId) : undefined
    if (!token || !record || record.token !== token || !record.valid) {
      sendJson(res, 400, { message: 'Invalid or expired token' })
    } else {
      record.valid = false
      sendJson(res, 200, { message: 'Token invalidated successfully' })
    }
    return
  }

  // GET /api/token/grant — grants a token for the current session (lets you in).
  if (url.pathname === '/api/token/grant' && req.method === 'GET') {
    const id = userId ?? crypto.randomUUID()
    const record = { token: `tok-${id}`, valid: true }
    tokens.set(id, record)
    setSessionCookie(res, id)
    sendJson(res, 200, { token: record.token, session: id })
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
  console.log(`  Request:        POST /api/token/request`)
  console.log(`  Validate:       GET  /api/token/validate?token=`)
  console.log(`  Invalidate:     GET  /api/token/invalidate?token=&userId=`)
  console.log(`  Grant:          GET  /api/token/grant`)
  console.log(`  Waiting room:   GET  /waiting-room`)
  console.log(`  Pass-through:   ${PASS_THROUGH ? 'on' : 'off (first request joins the queue)'}`)
})
