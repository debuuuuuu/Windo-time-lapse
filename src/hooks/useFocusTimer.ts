import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_FOCUS_CUSTOM_MINUTES,
  FOCUS_TIMER_CUSTOM,
  FOCUS_TIMER_OFF,
  PREFERRED_FOCUS_CUSTOM_MINUTES_KEY,
  PREFERRED_FOCUS_TIMER_KEY,
} from '../constants/focusTimer'

interface UseFocusTimerOptions {
  isRecording: boolean
  onAutoStop: () => Promise<void>
}

export function useFocusTimer({ isRecording, onAutoStop }: UseFocusTimerOptions) {
  const [focusTimerValue, setFocusTimerValueState] = useState(() => {
    const cached = localStorage.getItem(PREFERRED_FOCUS_TIMER_KEY)
    return cached ? Number(cached) : FOCUS_TIMER_OFF
  })
  const [customFocusMinutes, setCustomFocusMinutesState] = useState(() => {
    const cached = localStorage.getItem(PREFERRED_FOCUS_CUSTOM_MINUTES_KEY)
    return cached ? Number(cached) : DEFAULT_FOCUS_CUSTOM_MINUTES
  })
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)

  const endsAtRef = useRef<number | null>(null)
  const autoStoppedRef = useRef(false)
  const onAutoStopRef = useRef(onAutoStop)
  onAutoStopRef.current = onAutoStop

  const focusDurationMs = useMemo(() => {
    if (focusTimerValue === FOCUS_TIMER_OFF) return null
    if (focusTimerValue === FOCUS_TIMER_CUSTOM) {
      return customFocusMinutes > 0 ? customFocusMinutes * 60 * 1000 : null
    }
    return focusTimerValue
  }, [focusTimerValue, customFocusMinutes])

  const isFocusTimerEnabled = focusDurationMs !== null

  const arm = useCallback((recordingStartedAt?: number) => {
    autoStoppedRef.current = false
    setJustCompleted(false)

    if (!focusDurationMs) {
      endsAtRef.current = null
      setRemainingMs(null)
      return
    }

    const start = recordingStartedAt ?? Date.now()
    endsAtRef.current = start + focusDurationMs
    setRemainingMs(Math.max(0, endsAtRef.current - Date.now()))
  }, [focusDurationMs])

  const disarm = useCallback(() => {
    endsAtRef.current = null
    setRemainingMs(null)
  }, [])

  const setFocusTimer = useCallback((value: number) => {
    setFocusTimerValueState(value)
    localStorage.setItem(PREFERRED_FOCUS_TIMER_KEY, String(value))
  }, [])

  const setCustomFocusMinutes = useCallback((minutes: number) => {
    setCustomFocusMinutesState(minutes)
    localStorage.setItem(PREFERRED_FOCUS_CUSTOM_MINUTES_KEY, String(minutes))
  }, [])

  const clearJustCompleted = useCallback(() => {
    setJustCompleted(false)
  }, [])

  useEffect(() => {
    if (!isRecording || endsAtRef.current === null) return

    const tick = () => {
      const end = endsAtRef.current
      if (end === null) return

      const left = Math.max(0, end - Date.now())
      setRemainingMs(left)

      if (left === 0 && !autoStoppedRef.current) {
        autoStoppedRef.current = true
        endsAtRef.current = null
        setJustCompleted(true)
        void onAutoStopRef.current()
      }
    }

    tick()
    const id = window.setInterval(tick, 100)
    return () => clearInterval(id)
  }, [isRecording])

  useEffect(() => {
    if (!isRecording && !justCompleted) {
      endsAtRef.current = null
      setRemainingMs(null)
    }
  }, [isRecording, justCompleted])

  return {
    focusTimerValue,
    customFocusMinutes,
    focusDurationMs,
    focusRemainingMs: remainingMs,
    isFocusTimerEnabled,
    justCompleted,
    arm,
    disarm,
    setFocusTimer,
    setCustomFocusMinutes,
    clearJustCompleted,
  }
}
