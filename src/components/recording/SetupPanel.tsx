import { useEffect, useState } from 'react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { CAPTURE_INTERVALS, CUSTOM_INTERVAL_VALUE } from '../../constants/intervals'
import { FormField, inputGlassClassName, selectGlassClassName } from '../ui/FormField'

const PRESET_VALUES = CAPTURE_INTERVALS.filter((i) => i.value !== CUSTOM_INTERVAL_VALUE)

export function SetupPanel() {
  const { devices, deviceId, intervalMs, isRecording, changeCamera, setIntervalMs } = useTimelapse()
  const [showCustom, setShowCustom] = useState(false)
  const [customSeconds, setCustomSeconds] = useState(String(intervalMs / 1000))

  useEffect(() => {
    const isCustom = !PRESET_VALUES.some((p) => p.value === intervalMs)
    setShowCustom(isCustom)
    if (isCustom) setCustomSeconds(String(intervalMs / 1000))
  }, [intervalMs])

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value)
    if (value === CUSTOM_INTERVAL_VALUE) {
      setShowCustom(true)
      const seconds = Number(customSeconds)
      if (seconds > 0) setIntervalMs(seconds * 1000)
    } else {
      setShowCustom(false)
      setIntervalMs(value)
    }
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomSeconds(val)
    const seconds = Number(val)
    if (seconds > 0) setIntervalMs(seconds * 1000)
  }

  return (
    <fieldset disabled={isRecording} className="flex flex-col gap-2.5 border-0 m-0 p-0 min-w-0">
      {isRecording && (
        <p className="text-[11px] text-[#FFD60A] font-medium leading-tight drop-shadow-sm" role="status">
          Locked while recording
        </p>
      )}

      <FormField id="camera-select" label="Camera" compact glass>
        <select
          id="camera-select"
          value={deviceId}
          onChange={(e) => void changeCamera(e.target.value)}
          className={selectGlassClassName}
        >
          {devices.length === 0 && <option value="" className="text-black">No camera</option>}
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId} className="text-black">
              {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="interval-select" label="Interval" compact glass>
        <select
          id="interval-select"
          value={showCustom ? CUSTOM_INTERVAL_VALUE : intervalMs}
          onChange={handleIntervalChange}
          className={selectGlassClassName}
        >
          {CAPTURE_INTERVALS.map((item) => (
            <option key={item.value} value={item.value} className="text-black">
              {item.value === CUSTOM_INTERVAL_VALUE
                ? 'Custom…'
                : item.label.replace(' Seconds', 's').replace(' Second', 's')}
            </option>
          ))}
        </select>
      </FormField>

      {showCustom && (
        <FormField id="custom-interval" label="Seconds" compact glass>
          <input
            id="custom-interval"
            type="number"
            min="0.5"
            max="3600"
            step="0.5"
            value={customSeconds}
            onChange={handleCustomChange}
            className={inputGlassClassName}
          />
        </FormField>
      )}
    </fieldset>
  )
}
