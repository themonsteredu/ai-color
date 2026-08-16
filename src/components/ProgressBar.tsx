interface ProgressBarProps {
  value: number
  label?: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value))
  return (
    <div className="progress-wrap">
      <div className="progress-copy">
        <span>{label ?? '오늘의 컬러 활동'}</span>
        <strong>{Math.round(safeValue)}%</strong>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}

