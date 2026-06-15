import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { TimelapseProvider } from './context/TimelapseProvider'
import { AppErrorBoundary } from './components/layout/AppErrorBoundary'

if (import.meta.env.MODE !== 'extension') {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <TimelapseProvider>
        <App />
      </TimelapseProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
