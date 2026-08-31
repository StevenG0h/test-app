import type { AppConfig } from '../config'

export default function HomePage({ config }: { config: AppConfig }) {
  return (
    <main className="card">
      <header className="card-header">
        <span className="badge badge-ok">● Session active</span>
        <h1>You&rsquo;re in</h1>
      </header>
      <p>
        This is the protected area of the test app. On load, the app called the
        configured validation endpoint and your session is still active.
      </p>
      <nav className="actions">
        <a className="button button-danger" href="#/expire">
          Expire session
        </a>
      </nav>
      <details className="debug">
        <summary>Validation details</summary>
        <dl>
          <dt>Validation endpoint</dt>
          <dd>{config.validateUrl}</dd>
          <dt>Revoke endpoint</dt>
          <dd>{config.revokeUrl}</dd>
          <dt>Session cookie</dt>
          <dd>{config.sessionCookieName}</dd>
          <dt>Waiting room URL</dt>
          <dd>{config.waitingRoomUrl}</dd>
        </dl>
      </details>
    </main>
  )
}
