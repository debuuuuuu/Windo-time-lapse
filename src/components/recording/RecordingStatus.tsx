import { useTimelapse } from '../../context/TimelapseProvider'

export function RecordingStatus() {
  const { isRecording, frameCount } = useTimelapse()

  return (
    <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-20 pointer-events-none">
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
          isRecording ? 'bg-[#FF3B30] text-white' : 'bg-black/50 text-white'
        }`}
        role="status"
      >
        {isRecording ? '● REC' : 'Live'}
      </span>
      {isRecording && (
        <span className="px-2 py-0.5 rounded bg-black/50 text-white text-[11px] font-semibold tabular-nums">
          {frameCount}
        </span>
      )}
    </div>
  )
}
