import { FPS_OPTIONS, type FpsOption } from '../../constants/fps'

interface FpsSelectorProps {
  value: FpsOption
  onChange: (fps: FpsOption) => void
  disabled?: boolean
}

export function FpsSelector({ value, onChange, disabled }: FpsSelectorProps) {
  return (
    <fieldset disabled={disabled} className="border-0 p-0 m-0">
      <legend className="text-xs font-semibold text-white/80 mb-1.5 drop-shadow-sm">Export FPS</legend>
      <div className="flex gap-1" role="radiogroup" aria-label="Output frame rate">
        {FPS_OPTIONS.map((fps) => (
          <label
            key={fps}
            className={`flex-1 flex items-center justify-center h-8 rounded-lg border text-xs font-semibold cursor-pointer transition-colors backdrop-blur-sm ${
              value === fps
                ? 'border-white/60 bg-white/30 text-white'
                : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="fps"
              value={fps}
              checked={value === fps}
              onChange={() => onChange(fps)}
              className="sr-only"
              disabled={disabled}
            />
            {fps}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
