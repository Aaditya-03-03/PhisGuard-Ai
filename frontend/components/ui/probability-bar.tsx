import { cn } from "@/lib/utils"

interface ProbabilityBarProps {
  value: number // 0-100 or 0-1
  label?: string
  showPercentage?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProbabilityBar({ value, label, showPercentage = true, size = "md", className }: ProbabilityBarProps) {
  // Normalize value: if it's a decimal (0-1), convert to percentage
  const normalizedValue = value <= 1 ? value * 100 : value
  // Round to 1 decimal place for display
  const displayValue = Math.round(normalizedValue * 10) / 10

  const getColor = (val: number) => {
    if (val >= 70) return { bg: "bg-risk-high", glow: "shadow-[0_0_10px_rgba(255,71,87,0.5)]" }
    if (val >= 40) return { bg: "bg-risk-medium", glow: "shadow-[0_0_10px_rgba(255,165,2,0.5)]" }
    return { bg: "bg-risk-low", glow: "shadow-[0_0_10px_rgba(46,213,115,0.5)]" }
  }

  const colors = getColor(normalizedValue)

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span
              className={cn(
                "text-sm font-bold whitespace-nowrap",
                normalizedValue >= 70 && "text-risk-high",
                normalizedValue >= 40 && normalizedValue < 70 && "text-risk-medium",
                normalizedValue < 40 && "text-risk-low",
              )}
            >
              {displayValue}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-navy-lighter rounded-full overflow-hidden",
          size === "sm" && "h-2",
          size === "md" && "h-3",
          size === "lg" && "h-4",
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colors.bg, colors.glow)}
          style={{ width: `${Math.min(normalizedValue, 100)}%` }}
        />
      </div>
    </div>
  )
}
