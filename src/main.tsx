import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary'
import { notifyGlobalError } from '@/components/common/errorAlerts'

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Promise Rejection]:', event.reason)
  notifyGlobalError(event.reason, 'Background task failed')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary boundaryName="App Root">
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
