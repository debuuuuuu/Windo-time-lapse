import { useCallback, useEffect, useRef, useState } from 'react'
import { cameraService } from '../services/camera/CameraService'

const PREFERRED_DEVICE_KEY = 'preferredDeviceId'

interface UseCameraOptions {
  /** Request camera on mount (returning users who completed welcome). */
  autoStart?: boolean
}

export function useCamera(options: UseCameraOptions = {}) {
  const { autoStart = false } = options
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem(PREFERRED_DEVICE_KEY) ?? '')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(autoStart)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const refreshDevices = useCallback(async () => {
    const videoDevices = await cameraService.enumerate()
    setDevices(videoDevices)
    return videoDevices
  }, [])

  const requestCameraAccess = useCallback(async (preferredDeviceId?: string) => {
    setIsInitializing(true)
    setPermissionError(null)

    try {
      const targetId = preferredDeviceId ?? deviceId
      const newStream = await cameraService.start(targetId)
      setStream(newStream)

      const videoDevices = await refreshDevices()
      const activeTrack = newStream.getVideoTracks()[0]
      const actualDeviceId = activeTrack?.getSettings().deviceId

      if (actualDeviceId) {
        setDeviceId(actualDeviceId)
        localStorage.setItem(PREFERRED_DEVICE_KEY, actualDeviceId)
      } else if (videoDevices[0]) {
        setDeviceId(videoDevices[0].deviceId)
      }
    } catch (error) {
      console.error('Camera access failed:', error)
      const err = error as DOMException
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera access denied. Please grant permission in your browser.')
      } else {
        setPermissionError('Could not initialize video source. Ensure a camera is connected.')
      }
    } finally {
      setIsInitializing(false)
    }
  }, [deviceId, refreshDevices])

  const changeCamera = useCallback(async (nextDeviceId: string) => {
    setDeviceId(nextDeviceId)
    localStorage.setItem(PREFERRED_DEVICE_KEY, nextDeviceId)

    try {
      setPermissionError(null)
      const newStream = await cameraService.start(nextDeviceId)
      setStream(newStream)
    } catch (error) {
      console.error('Failed to change camera:', error)
      setPermissionError('Could not start the selected camera source.')
    }
  }, [])

  useEffect(() => {
    if (autoStart) void requestCameraAccess()

    const unsubscribe = cameraService.onDeviceChange(() => {
      void refreshDevices()
    })

    return () => {
      unsubscribe()
      cameraService.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const getVideoDimensions = useCallback((): { width: number; height: number } => {
    const video = videoRef.current
    if (video && video.videoWidth > 0) {
      return { width: video.videoWidth, height: video.videoHeight }
    }
    const track = stream?.getVideoTracks()[0]
    const settings = track?.getSettings()
    return {
      width: settings?.width ?? 1280,
      height: settings?.height ?? 720,
    }
  }, [stream])

  const getDeviceLabel = useCallback(
    (id: string): string => {
      const device = devices.find((d) => d.deviceId === id)
      return device?.label || 'Unknown Camera'
    },
    [devices],
  )

  return {
    devices,
    stream,
    deviceId,
    permissionError,
    isInitializing,
    videoRef,
    changeCamera,
    requestCameraAccess,
    getVideoDimensions,
    getDeviceLabel,
  }
}
