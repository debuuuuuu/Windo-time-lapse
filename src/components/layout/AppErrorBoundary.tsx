import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleClearData = async () => {
    try {
      localStorage.clear()
      const dbs = await indexedDB.databases()
      await Promise.all(
        dbs.map(
          (db) =>
            new Promise<void>((resolve) => {
              if (!db.name) { resolve(); return }
              const req = indexedDB.deleteDatabase(db.name)
              req.onsuccess = () => resolve()
              req.onerror = () => resolve()
            }),
        ),
      )
    } catch {
      // Best-effort
    }
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="fixed inset-0 bg-black flex items-center justify-center p-6"
        role="alert"
        aria-live="assertive"
      >
        <div className="glass-dock-inner rounded-2xl p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-base font-semibold text-white mb-1">Something went wrong</h1>
            {this.state.message && (
              <p className="text-xs text-white/50 font-mono bg-white/5 rounded-lg px-3 py-2 mt-2 break-all">
                {this.state.message}
              </p>
            )}
          </div>

          <p className="text-sm text-white/55">
            Try reloading the app. If the problem persists, clearing saved data will reset to a
            fresh state.
          </p>

          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={this.handleReload}
              className="dock-btn dock-btn-primary w-full"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Reload App
            </button>
            <button
              type="button"
              onClick={() => void this.handleClearData()}
              className="dock-btn dock-btn-danger w-full"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Clear Data &amp; Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
