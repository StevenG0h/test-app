import { useCallback, useEffect, useRef, useState } from 'react'
import {
  requestToken,
  validateToken,
  type RequestTokenResult,
  type ValidateResult,
} from '../api/session'

export type SessionGuardState =
  | { phase: 'checking' }
  | { phase: 'active'; token: string; session: string }
  | { phase: 'waiting' }
  | { phase: 'queueing' }
  | { phase: 'error'; message: string }

/**
 * Guards the whole app against the waiting-room token backend:
 *  - on mount, requests a token (`requestToken`) — the backend either passes
 *    the caller straight through or hands back an existing token (`active`),
 *    or puts them in the queue (`queueing`)
 *  - re-checks the current token on every `hashchange` (route change); if it
 *    is no longer valid the app switches to the in-app waiting room (`waiting`)
 *  - "check again" re-requests a fresh token from the backend
 *  - on network/endpoint errors, surfaces a retry state instead of locking the
 *    user out, so a broken endpoint doesn't trap everyone in the waiting room
 */
export function useSessionGuard(requestTokenUrl: string, validateTokenUrl: string) {
  const [state, setState] = useState<SessionGuardState>({ phase: 'checking' })
  const [token, setToken] = useState('')
  const inFlight = useRef(false)

  const applyRequest = useCallback((result: RequestTokenResult) => {
    switch (result.status) {
      case 'active':
        setToken(result.token)
        setState({ phase: 'active', token: result.token, session: result.session })
        break
      case 'queueing':
        setToken('')
        setState({ phase: 'queueing' })
        break
      case 'error':
        setState({ phase: 'error', message: result.message })
        break
    }
  }, [])

  const applyValidate = useCallback((result: ValidateResult) => {
    switch (result.status) {
      case 'active':
        // Token is still valid — stay in the active phase.
        break
      case 'invalid':
        setToken('')
        setState({ phase: 'waiting' })
        break
      case 'error':
        setState({ phase: 'error', message: result.message })
        break
    }
  }, [])

  const request = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      applyRequest(await requestToken(requestTokenUrl))
    } finally {
      inFlight.current = false
    }
  }, [requestTokenUrl, applyRequest])

  const validate = useCallback(async () => {
    if (inFlight.current) return
    if (!token) return request()
    inFlight.current = true
    try {
      applyValidate(await validateToken(validateTokenUrl, token))
    } finally {
      inFlight.current = false
    }
  }, [token, validateTokenUrl, request, applyValidate])

  useEffect(() => {
    void request()
  }, [request])

  const onHashChange = useCallback(() => void validate(), [validate])
  useEffect(() => {
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [onHashChange])

  /** Re-run the entry check: request a (fresh) token from the backend. */
  const checkAgain = useCallback(() => {
    setState({ phase: 'checking' })
    void request()
  }, [request])

  return { state, checkAgain }
}
