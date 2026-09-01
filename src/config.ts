/**
 * Central configuration for the app.
 *
 * All values come from Vite env vars (see .env.example). `loadConfig()` fails
 * fast with a clear, visible message if a required variable is missing, so a
 * misconfigured test setup is obvious instead of silently misbehaving.
 */

export interface AppConfig {
  /** POST endpoint used to request a waiting-room token (cookies sent along). */
  requestTokenUrl: string
  /** GET endpoint used to validate a token, called with ?token=... . */
  validateTokenUrl: string
  /** GET endpoint used to invalidate a token, called with ?token=...&userId=... . */
  invalidateTokenUrl: string
  /** URL users are sent to when they are in the waiting room. */
  waitingRoomUrl: string
  /** Name of the session cookie. Informational only — see README. */
  sessionCookieName: string
}

const REQUIRED_VARS: Record<
  'requestTokenUrl' | 'validateTokenUrl' | 'invalidateTokenUrl' | 'waitingRoomUrl',
  string
> = {
  requestTokenUrl: 'VITE_REQUEST_TOKEN_URL',
  validateTokenUrl: 'VITE_VALIDATE_TOKEN_URL',
  invalidateTokenUrl: 'VITE_INVALIDATE_TOKEN_URL',
  waitingRoomUrl: 'VITE_WAITING_ROOM_URL',
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export function loadConfig(): AppConfig {
  for (const [key, envName] of Object.entries(REQUIRED_VARS)) {
    if (!import.meta.env[envName]) {
      throw new ConfigError(
        `Missing required environment variable "${envName}" (used for "${key}").\n` +
          'Copy .env.example to .env, set a value, then restart the dev server.',
      )
    }
  }

  return {
    requestTokenUrl: import.meta.env.VITE_REQUEST_TOKEN_URL as string,
    validateTokenUrl: import.meta.env.VITE_VALIDATE_TOKEN_URL as string,
    invalidateTokenUrl: import.meta.env.VITE_INVALIDATE_TOKEN_URL as string,
    waitingRoomUrl: import.meta.env.VITE_WAITING_ROOM_URL as string,
    sessionCookieName: import.meta.env.VITE_SESSION_COOKIE_NAME ?? 'session',
  }
}
