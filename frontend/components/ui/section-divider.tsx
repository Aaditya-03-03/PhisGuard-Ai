import { cn } from "@/lib/utils"

interface SectionDividerProps {
  className?: string
  variant?: "gradient" | "glow" | "dots"
}

export function SectionDivider({ className, variant = "gradient" }: SectionDividerProps) {
  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2 py-8", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-cyan/50" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    )
  }

  if (variant === "glow") {
    return (
      <div className={cn("relative h-px my-12", className)}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan to-transparent blur-sm" />
      </div>
    )
  }

  return (
    <div className={cn("relative h-px my-12", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
    </div>
  )
}
