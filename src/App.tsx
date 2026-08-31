import { useEffect, useState } from 'react'
import type { AppConfig } from './config'
import { useSessionGuard } from './hooks/useSessionGuard'
import ExpirePage from './pages/ExpirePage'
import HomePage from './pages/HomePage'
import WaitingRoomPage from './pages/WaitingRoomPage'

function getRoute(): string {
  return window.location.hash.replace(/^#\/?/, '') === 'expire' ? 'expire' : 'home'
}

export default function App({ config }: { config: AppConfig }) {
  const [route, setRoute] = useState(getRoute)
  const { state, retry } = useSessionGuard(config.validateUrl)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  switch (state.phase) {
    case 'checking':
      return <Splash label="Checking session…" />
    case 'waiting':
      return (
        <WaitingRoomPage waitingRoomUrl={config.waitingRoomUrl} onCheckAgain={retry} />
      )
    case 'error':
      return <ErrorScreen message={state.message} onRetry={retry} />
    case 'active':
      return route === 'expire' ? (
        <ExpirePage config={config} />
      ) : (
        <HomePage config={config} />
      )
  }
}

function Splash({ label }: { label: string }) {
  return (
    <main className="card splash">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </main>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="card result result-error">
      <h1>Session check failed</h1>
      <p className="muted">{message}</p>
      <div className="actions">
        <button className="button" type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </main>
  )
}
