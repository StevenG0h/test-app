import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ConfigErrorScreen from './components/ConfigErrorScreen.tsx'
import { ConfigError, loadConfig, type AppConfig } from './config.ts'
import './index.css'

function boot() {
  const rootElement = document.getElementById('root')!

  let config: AppConfig
  try {
    config = loadConfig()
  } catch (error) {
    const message =
      error instanceof ConfigError
        ? error.message
        : `Unexpected configuration error: ${String(error)}`
    createRoot(rootElement).render(<ConfigErrorScreen message={message} />)
    return
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App config={config} />
    </StrictMode>,
  )
}

boot()
