import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { validateEnv } from '@/config/env'
import { initSentry } from '@/config/sentry'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// ================================================
// PHASE 0 COMPLIANCE: VALIDATE ENVIRONMENT
// ================================================
// Fail-fast if required environment variables are missing
validateEnv();

// initSentry() dynamically imports @sentry/react, so it must be awaited before
// the first render — otherwise errors thrown during initial mount happen before
// the SDK's global handlers are installed and are never reported.
async function bootstrap(): Promise<void> {
  await initSentry();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

void bootstrap();
