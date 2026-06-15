import { Circle, Square } from 'lucide-react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { buttonGlassDangerClassName, buttonGlassPrimaryClassName } from '../ui/FormField'

export function RecordingControls() {
  const { isRecording, startRecording, stopRecording, stream, permissionError } = useTimelapse()
  const canRecord = Boolean(stream) && !permissionError

  if (!isRecording) {
    return (
      <button
        type="button"
        onClick={() => void startRecording()}
        disabled={!canRecord}
        className={buttonGlassPrimaryClassName}
        title={canRecord ? 'Start capturing frames' : 'Allow camera access first'}
      >
        <span className="flex items-center justify-center gap-2">
          <Circle className="w-4 h-4 fill-white" aria-hidden="true" />
          Start Recording
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void stopRecording()}
      className={buttonGlassDangerClassName}
      aria-label="Stop recording"
    >
      <span className="flex items-center justify-center gap-2">
        <Square className="w-3.5 h-3.5 fill-white" aria-hidden="true" />
        Stop Recording
      </span>
    </button>
  )
}
