/**
 * Central configuration for the app.
 *
 * All values come from Vite env vars (see .env.example). `loadConfig()` fails
 * fast with a clear, visible message if a required variable is missing, so a
 * misconfigured test setup is obvious instead of silently misbehaving.
 */

export interface AppConfig {
  /** GET endpoint used to validate the session (cookies are sent along). */
  validateUrl: string
  /** POST endpoint used to revoke the session (cookies are sent along). */
  revokeUrl: string
  /** URL users are redirected to when the session is missing or invalid. */
  waitingRoomUrl: string
  /** Name of the session cookie. Informational only — see README. */
  sessionCookieName: string
}

const REQUIRED_VARS: Record<'validateUrl' | 'revokeUrl' | 'waitingRoomUrl', string> = {
  validateUrl: 'VITE_VALIDATE_URL',
  revokeUrl: 'VITE_REVOKE_URL',
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
    validateUrl: import.meta.env.VITE_VALIDATE_URL as string,
    revokeUrl: import.meta.env.VITE_REVOKE_URL as string,
    waitingRoomUrl: import.meta.env.VITE_WAITING_ROOM_URL as string,
    sessionCookieName: import.meta.env.VITE_SESSION_COOKIE_NAME ?? 'session',
  }
}
