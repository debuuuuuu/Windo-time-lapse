import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Film, Layers, ChevronRight, X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

const WELCOME_SEEN_KEY = 'timelapse_welcome_seen'

interface WelcomeOverlayProps {
  onStart: () => void
}

const STEPS = [
  {
    icon: Camera,
    iconColor: 'text-blue-400',
    title: 'Connect your camera',
    desc: 'Use any webcam, OBS Virtual Camera, or USB capture card as your source. Camera access is requested once and stays local.',
  },
  {
    icon: Layers,
    iconColor: 'text-emerald-400',
    title: 'Set your interval & record',
    desc: 'Choose how often a frame is captured — from 0.5 seconds to hours. Frames are stored privately in your browser. Nothing leaves your device.',
  },
  {
    icon: Film,
    iconColor: 'text-purple-400',
    title: 'Export your timelapse',
    desc: 'Stop recording and export a smooth MP4 in seconds. GPU-accelerated WebCodecs keeps it fast. Download directly — no server involved.',
  },
]

export function WelcomeOverlay({ onStart }: WelcomeOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(WELCOME_SEEN_KEY) === 'true',
  )
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef, visible && !dismissed)

  const handleDismiss = useCallback(() => {
    localStorage.setItem(WELCOME_SEEN_KEY, 'true')
    setDismissed(true)
  }, [])

  useEffect(() => {
    if (!dismissed) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
  }, [dismissed])

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => closeRef.current?.focus())
    }
  }, [visible])

  useEffect(() => {
    if (!visible || dismissed) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleDismiss()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, dismissed, handleDismiss])

  const handleStart = () => {
    handleDismiss()
    onStart()
  }

  if (dismissed) return null

  const CurrentIcon = STEPS[step].icon
  const isLast = step === STEPS.length - 1

  return (
    <>
      <div className="welcome-backdrop" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className={`welcome-overlay motion-safe:transition-all motion-safe:duration-500 ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={handleDismiss}
          aria-label="Skip intro"
          className="welcome-skip"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="welcome-steps" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`welcome-step-dot ${i === step ? 'welcome-step-dot-active' : ''}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="welcome-icon-ring" aria-hidden="true">
          <CurrentIcon className={`w-8 h-8 ${STEPS[step].iconColor}`} />
        </div>

        {/* Content */}
        <div className="welcome-content">
          <h2 id="welcome-title" className="welcome-title">
            {STEPS[step].title}
          </h2>
          <p className="welcome-desc">{STEPS[step].desc}</p>
        </div>

        {/* Actions */}
        <div className="welcome-actions">
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="dock-btn dock-btn-primary welcome-btn-full"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="dock-btn dock-btn-primary welcome-btn-full"
            >
              <Camera className="w-4 h-4" />
              Allow camera &amp; get started
            </button>
          )}
        </div>

        <p className="welcome-footer">
          Your footage never leaves your device. All processing is local.
        </p>
      </div>
    </>
  )
}
