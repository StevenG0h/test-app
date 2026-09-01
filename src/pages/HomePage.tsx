import type { AppConfig } from '../config'

export default function HomePage({ config, token }: { config: AppConfig; token: string }) {
  return (
    <main className="card">
      <header className="card-header">
        <span className="badge badge-ok">● Session active</span>
        <h1>You&rsquo;re in</h1>
      </header>
      <p>
        This is the protected area of the test app. On load, the app requested a
        token from the configured endpoint and was let straight through.
      </p>
      <nav className="actions">
        <a className="button button-danger" href="#/expire">
          Expire session
        </a>
      </nav>
      <details className="debug">
        <summary>Token details</summary>
        <dl>
          <dt>Token</dt>
          <dd>
            <code>{token}</code>
          </dd>
          <dt>Request token endpoint</dt>
          <dd>{config.requestTokenUrl}</dd>
          <dt>Validate token endpoint</dt>
          <dd>{config.validateTokenUrl}</dd>
          <dt>Invalidate token endpoint</dt>
          <dd>{config.invalidateTokenUrl}</dd>
          <dt>Session cookie</dt>
          <dd>{config.sessionCookieName}</dd>
          <dt>Waiting room URL</dt>
          <dd>{config.waitingRoomUrl}</dd>
        </dl>
      </details>
    </main>
  )
}
