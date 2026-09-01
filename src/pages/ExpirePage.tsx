import { useState } from 'react'
import { invalidateToken } from '../api/session'
import type { AppConfig } from '../config'

type Phase = 'idle' | 'revoking' | 'revoked' | 'failed'

export default function ExpirePage({
  config,
  token,
  session,
}: {
  config: AppConfig
  token: string
  session: string
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')

  const handleRevoke = async () => {
    setPhase('revoking')
    const result = await invalidateToken(config.invalidateTokenUrl, token, session)
    if (result.ok) {
      setPhase('revoked')
    } else {
      setPhase('failed')
      setMessage(result.message)
    }
  }

  return (
    <main className="card">
      <header className="card-header">
        <span className="badge badge-warn">● Expire session</span>
        <h1>Revoke this token</h1>
      </header>
      <p>
        This page calls the configured invalidate endpoint (
        <code>{config.invalidateTokenUrl}</code>) with your token and session id.
        After invalidating, navigate back to the home page — the next token
        check should fail and send you to the in-app waiting room.
      </p>

      {phase === 'idle' && (
        <div className="actions">
          <button className="button button-danger" type="button" onClick={handleRevoke}>
            Revoke token
          </button>
        </div>
      )}

      {phase === 'revoking' && <p className="muted">Revoking token&hellip;</p>}

      {phase === 'revoked' && (
        <div className="result result-ok">
          <p>Token revoked successfully.</p>
          <nav className="actions">
            <a className="button" href="#/">
              Back to home (will send you to the waiting room)
            </a>
          </nav>
        </div>
      )}

      {phase === 'failed' && (
        <div className="result result-error">
          <p>Failed to revoke the token.</p>
          <p className="muted">{message}</p>
          <div className="actions">
            <button className="button" type="button" onClick={handleRevoke}>
              Try again
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
