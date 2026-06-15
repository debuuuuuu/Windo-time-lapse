import { useEffect, useState } from 'react'
import { Camera, VideoOff } from 'lucide-react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { FRAME_CAPTURED_EVENT } from '../../services/capture/FrameCaptureService'
import { RecordingTimerOverlay } from '../recording/RecordingTimerOverlay'
import { LiveClockDisplay } from '../recording/LiveClockDisplay'

export function LivePreview() {
  const { stream, permissionError, isInitializing, videoRef, requestCameraAccess } = useTimelapse()
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const handleFrameCaptured = () => {
      setFlash(true)
      setTimeout(() => setFlash(false), 120)
    }
    window.addEventListener(FRAME_CAPTURED_EVENT, handleFrameCaptured)
    return () => window.removeEventListener(FRAME_CAPTURED_EVENT, handleFrameCaptured)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      {stream && !permissionError && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-cover absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2"
          aria-label="Live camera preview"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />

      <div
        className={`absolute inset-0 bg-white pointer-events-none z-[1] motion-safe:transition-opacity motion-safe:duration-100 ${
          flash ? 'opacity-25' : 'opacity-0'
        }`}
      />

      <RecordingTimerOverlay />
      <LiveClockDisplay />

      {permissionError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <VideoOff className="w-12 h-12 text-white/90 mb-4" />
          <p className="text-lg font-semibold text-white mb-2">Camera access needed</p>
          <p className="text-sm text-white/60 mb-6 text-center max-w-xs px-4">{permissionError}</p>
          <button
            type="button"
            onClick={() => void requestCameraAccess()}
            className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Allow camera
          </button>
        </div>
      )}

      {!stream && !permissionError && isInitializing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950">
          <Camera className="w-10 h-10 text-white/40 mb-3 animate-pulse" />
          <span className="text-sm text-white/50">Starting camera…</span>
        </div>
      )}
    </div>
  )
}
