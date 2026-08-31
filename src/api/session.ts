/**
 * Thin wrappers around the configured session endpoints.
 *
 * Every call uses `credentials: 'include'` so cookies are sent automatically.
 * The endpoints are the source of truth for whether a session exists and is
 * still valid — the app deliberately does NOT parse `document.cookie`, so
 * HttpOnly session cookies work fine.
 */

export type ValidateResult =
  | { status: 'active' }
  | { status: 'expired' }
  | { status: 'error'; message: string }

export type RevokeResult = { ok: true } | { ok: false; message: string }

/**
 * Validates the session against the configured GET endpoint.
 *
 * - 2xx     => active
 * - 401/403 => expired (the caller decides what to do, e.g. redirect)
 * - anything else / network failure => error
 */
export async function validateSession(validateUrl: string): Promise<ValidateResult> {
  let response: Response
  try {
    response = await fetch(validateUrl, {
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
  if (response.status === 401 || response.status === 403) {
    return { status: 'expired' }
  }
  return {
    status: 'error',
    message: `Validation endpoint returned HTTP ${response.status}.`,
  }
}

export async function requestSession(requestUrl: string) {
    let response: Response
    try {
        response = await fetch(requestUrl, {
        method: 'POST',
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
    if (response.status === 401 || response.status === 403) {
        return { status: 'expired' }
    }
    return {
        status: 'error',
        message: `Validation endpoint returned HTTP ${response.status}.`,
    }
}

/**
 * Revokes the session against the configured POST endpoint.
 */
export async function revokeSession(revokeUrl: string): Promise<RevokeResult> {
  let response: Response
  try {
    response = await fetch(revokeUrl, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    return { ok: false, message: `Could not reach the revoke endpoint: ${errorMessage(error)}` }
  }

  if (response.ok) return { ok: true }
  return { ok: false, message: `Revoke endpoint returned HTTP ${response.status}.` }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
