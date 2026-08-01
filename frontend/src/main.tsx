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

// ================================================
// PHASE 0 COMPLIANCE: INITIALIZE SENTRY MONITORING
// ================================================
// Error tracking (graceful degradation if SENTRY_DSN not set)
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
