import type { CaptureSource } from '../../types/capture'

export class CameraService implements CaptureSource {
  readonly type = 'camera' as const

  private stream: MediaStream | null = null

  async enumerate(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'videoinput')
  }

  async start(deviceId: string): Promise<MediaStream> {
    this.stop()

    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false,
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    return this.stream
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  getActiveDeviceId(): string | undefined {
    const track = this.stream?.getVideoTracks()[0]
    return track?.getSettings().deviceId
  }

  onDeviceChange(callback: () => void): () => void {
    navigator.mediaDevices.addEventListener('devicechange', callback)
    return () => navigator.mediaDevices.removeEventListener('devicechange', callback)
  }
}

export const cameraService = new CameraService()
