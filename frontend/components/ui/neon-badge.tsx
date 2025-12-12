import type React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const neonBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300",
  {
    variants: {
      variant: {
        high: "bg-risk-high/20 text-risk-high border border-risk-high/30 shadow-[0_0_10px_rgba(255,71,87,0.3)]",
        medium: "bg-risk-medium/20 text-risk-medium border border-risk-medium/30 shadow-[0_0_10px_rgba(255,165,2,0.3)]",
        low: "bg-risk-low/20 text-risk-low border border-risk-low/30 shadow-[0_0_10px_rgba(46,213,115,0.3)]",
        cyan: "bg-cyan/20 text-cyan border border-cyan/30 shadow-[0_0_10px_rgba(39,243,214,0.3)]",
        blue: "bg-blue/20 text-blue border border-blue/30 shadow-[0_0_10px_rgba(58,134,255,0.3)]",
        neutral: "bg-white/10 text-white/80 border border-white/20",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

interface NeonBadgeProps extends VariantProps<typeof neonBadgeVariants> {
  children: React.ReactNode
  className?: string
  pulse?: boolean
}

export function NeonBadge({ variant, children, className, pulse = false }: NeonBadgeProps) {
  return (
    <span className={cn(neonBadgeVariants({ variant }), pulse && "animate-glow-pulse", className)}>
      {pulse && (
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            variant === "high" && "bg-risk-high",
            variant === "medium" && "bg-risk-medium",
            variant === "low" && "bg-risk-low",
            variant === "cyan" && "bg-cyan",
            variant === "blue" && "bg-blue",
            variant === "neutral" && "bg-white/60",
          )}
        />
      )}
      {children}
    </span>
  )
}
