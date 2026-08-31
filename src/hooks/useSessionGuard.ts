import { useCallback, useEffect, useRef, useState } from 'react'
import { validateSession, type ValidateResult } from '../api/session'

export type SessionGuardState =
  | { phase: 'checking' }
  | { phase: 'active' }
  | { phase: 'waiting' }
  | { phase: 'error'; message: string }

/**
 * Guards the whole app:
 *  - validates on mount (initial page load)
 *  - re-validates on every `hashchange` (route change)
 *  - on an expired session, switches to the in-app waiting room (`waiting`)
 *  - on network/endpoint errors, surfaces a retry state instead of locking the
 *    user out, so a broken endpoint doesn't trap everyone in the waiting room
 */
export function useSessionGuard(validateUrl: string) {
  const [state, setState] = useState<SessionGuardState>({ phase: 'checking' })
  const inFlight = useRef(false)

  const applyResult = useCallback((result: ValidateResult) => {
    switch (result.status) {
      case 'active':
        setState({ phase: 'active' })
        break
      case 'expired':
        setState({ phase: 'waiting' })
        break
      case 'error':
        setState({ phase: 'error', message: result.message })
        break
    }
  }, [])

  const validate = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      applyResult(await validateSession(validateUrl))
    } finally {
      inFlight.current = false
    }
  }, [validateUrl, applyResult])

  useEffect(() => {
    void validate()
    window.addEventListener('hashchange', validate)
    return () => window.removeEventListener('hashchange', validate)
  }, [validate])

  const retry = useCallback(() => {
    setState({ phase: 'checking' })
    void validate()
  }, [validate])

  return { state, retry }
}
