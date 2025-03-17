interface ProgressBarProps {
  percentage: number
  label: string
  color: string
}

export function ProgressBar({ percentage, label, color }: ProgressBarProps) {
  return (
    <div>
      <div className="h-6 bg-gray-300 rounded-md overflow-hidden mb-2">
        <div
          className="h-full rounded-md"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        >
          <div className="text-white text-center text-sm font-medium">{percentage}%</div>
        </div>
      </div>
      <div className="text-sm text-gray-700">{label}</div>
    </div>
  )
}

