import { useCallback, useState } from 'react'
import {
  DEFAULT_CLOCK_BURNIN,
  DEFAULT_CLOCK_VISIBLE,
  PREFERRED_CLOCK_BURNIN_KEY,
  PREFERRED_CLOCK_VISIBLE_KEY,
} from '../constants/clockOverlay'
import {
  DEFAULT_TIMER_BURNIN,
  DEFAULT_TIMER_MODE,
  DEFAULT_TIMER_VISIBLE,
  PREFERRED_TIMER_BURNIN_KEY,
  PREFERRED_TIMER_MODE_KEY,
  PREFERRED_TIMER_VISIBLE_KEY,
  type TimerOverlayMode,
} from '../constants/timerOverlay'

function readBool(key: string, fallback: boolean): boolean {
  const v = localStorage.getItem(key)
  if (v === null) return fallback
  return v === 'true'
}

export function useTimerOverlaySettings() {
  const [timerMode, setTimerModeState] = useState<TimerOverlayMode>(() => {
    const v = localStorage.getItem(PREFERRED_TIMER_MODE_KEY)
    return v === 'focus' ? 'focus' : DEFAULT_TIMER_MODE
  })
  const [timerOverlayVisible, setTimerOverlayVisibleState] = useState(() =>
    readBool(PREFERRED_TIMER_VISIBLE_KEY, DEFAULT_TIMER_VISIBLE),
  )
  const [timerBurnIn, setTimerBurnInState] = useState(() =>
    readBool(PREFERRED_TIMER_BURNIN_KEY, DEFAULT_TIMER_BURNIN),
  )
  const [clockVisible, setClockVisibleState] = useState(() =>
    readBool(PREFERRED_CLOCK_VISIBLE_KEY, DEFAULT_CLOCK_VISIBLE),
  )
  const [clockBurnIn, setClockBurnInState] = useState(() =>
    readBool(PREFERRED_CLOCK_BURNIN_KEY, DEFAULT_CLOCK_BURNIN),
  )

  const setTimerMode = useCallback((mode: TimerOverlayMode) => {
    setTimerModeState(mode)
    localStorage.setItem(PREFERRED_TIMER_MODE_KEY, mode)
  }, [])

  const setTimerOverlayVisible = useCallback((visible: boolean) => {
    setTimerOverlayVisibleState(visible)
    localStorage.setItem(PREFERRED_TIMER_VISIBLE_KEY, String(visible))
  }, [])

  const setTimerBurnIn = useCallback((enabled: boolean) => {
    setTimerBurnInState(enabled)
    localStorage.setItem(PREFERRED_TIMER_BURNIN_KEY, String(enabled))
  }, [])

  const setClockVisible = useCallback((visible: boolean) => {
    setClockVisibleState(visible)
    localStorage.setItem(PREFERRED_CLOCK_VISIBLE_KEY, String(visible))
  }, [])

  const setClockBurnIn = useCallback((enabled: boolean) => {
    setClockBurnInState(enabled)
    localStorage.setItem(PREFERRED_CLOCK_BURNIN_KEY, String(enabled))
  }, [])

  return {
    timerMode,
    timerOverlayVisible,
    timerBurnIn,
    clockVisible,
    clockBurnIn,
    setTimerMode,
    setTimerOverlayVisible,
    setTimerBurnIn,
    setClockVisible,
    setClockBurnIn,
  }
}
