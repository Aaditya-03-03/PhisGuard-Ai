import { cn } from "@/lib/utils"
import { forwardRef, type HTMLAttributes } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle"
  glow?: "none" | "cyan" | "blue"
  hover?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow = "none", hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-6 transition-all duration-300",
          variant === "default" && "glass",
          variant === "strong" && "glass-strong",
          variant === "subtle" && "bg-navy-lighter/40 backdrop-blur-sm border border-cyan/10",
          glow === "cyan" && "glow-cyan",
          glow === "blue" && "glow-blue",
          hover && "hover:border-cyan/40 hover:glow-cyan hover:scale-[1.02]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
