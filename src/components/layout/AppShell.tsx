import { LivePreview } from '../camera/LivePreview'
import { AppHeader } from './AppHeader'
import { ControlDock } from './ControlDock'

export function AppShell() {
  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-black">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-1.5 focus:bg-white focus:text-black focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to controls
      </a>

      <LivePreview />
      <AppHeader />
      <ControlDock />
    </div>
  )
}
