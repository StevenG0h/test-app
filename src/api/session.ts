/**
 * Thin wrappers around the waiting-room token endpoints.
 *
 * Every call uses `credentials: 'include'` so cookies are sent automatically.
 * The endpoints are the source of truth for whether a session exists and is
 * still valid — the app deliberately does NOT parse `document.cookie`, so
 * HttpOnly session cookies work fine.
 *
 * Expected contract (Go/Fiber backend):
 *   POST /request
 *     200 { token, session }   -> pass-through, user is in
 *     200 { token }            -> existing session, user is in
 *     200 { message }          -> joined the queue, wait
 *     5xx                      -> server error
 *   GET  /validate-token?token=...
 *     200                      -> token is valid
 *     400                      -> token missing/invalid/expired
 *   GET  /invalidate-token?token=...&userId=...
 *     200                      -> token invalidated
 *     400                      -> token invalid/expired
 */

export type RequestTokenResult =
  | { status: 'active'; token: string; session: string }
  | { status: 'queueing' }
  | { status: 'error'; message: string }

export type ValidateResult =
  | { status: 'active' }
  | { status: 'invalid' }
  | { status: 'error'; message: string }

export type RevokeResult = { ok: true } | { ok: false; message: string }

/**
 * Requests a token from the configured endpoint. The backend decides whether
 * the caller passes straight through, joins the queue, or already has a token.
 *
 * - 200 {token[, session]} => active (pass-through or existing session)
 * - 200 {message}          => queueing (joined the queue)
 * - anything else / network failure => error
 */
export async function requestToken(requestTokenUrl: string): Promise<RequestTokenResult> {
  let response: Response
  try {
    response = await fetch(requestTokenUrl, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    return { status: 'error', message: `Could not reach the token endpoint: ${errorMessage(error)}` }
  }

  if (!response.ok) {
    return { status: 'error', message: `Token endpoint returned HTTP ${response.status}.` }
  }

  const body = (await response.json().catch(() => null)) as
    | { token?: string; session?: string }
    | null
  if (body?.token) {
    return { status: 'active', token: body.token, session: body.session ?? '' }
  }
  // { message: "User has joined the queue please wait" }
  return { status: 'queueing' }
}

/**
 * Validates the current token against the configured GET endpoint.
 *
 * - 200 => active
 * - 400 => invalid (missing/invalid/expired token) — the caller decides what
 *          to do, e.g. send the user back to the waiting room
 * - anything else / network failure => error
 */
export async function validateToken(
  validateTokenUrl: string,
  token: string,
): Promise<ValidateResult> {
  let response: Response
  try {
    response = await fetch(withQuery(validateTokenUrl, { token }), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    return {
      status: 'error',
      message: `Could not reach the validation endpoint: ${errorMessage(error)}`,
    }
  }

  if (response.ok) return { status: 'active' }
  if (response.status === 400) return { status: 'invalid' }
  return { status: 'error', message: `Validation endpoint returned HTTP ${response.status}.` }
}

/**
 * Invalidates the token against the configured endpoint.
 */
export async function invalidateToken(
  invalidateTokenUrl: string,
  token: string,
  sessionId: string,
): Promise<RevokeResult> {
  const params: Record<string, string> = { token }
  if (sessionId) params.userId = sessionId

  let response: Response
  try {
    response = await fetch(withQuery(invalidateTokenUrl, params), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    return {
      ok: false,
      message: `Could not reach the invalidate endpoint: ${errorMessage(error)}`,
    }
  }

  if (response.ok) return { ok: true }
  return { ok: false, message: `Invalidate endpoint returned HTTP ${response.status}.` }
}

/** Appends query params to an absolute URL, preserving any that already exist. */
function withQuery(url: string, params: Record<string, string>): string {
  const parsed = new URL(url)
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value)
  }
  return parsed.toString()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
