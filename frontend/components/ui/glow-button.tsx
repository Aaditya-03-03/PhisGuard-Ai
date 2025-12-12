import { cn } from "@/lib/utils"
import { forwardRef, type ButtonHTMLAttributes } from "react"

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  glow?: boolean
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "primary", size = "md", glow = true, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
          // Size variants
          size === "sm" && "px-4 py-2 text-sm",
          size === "md" && "px-6 py-3 text-base",
          size === "lg" && "px-8 py-4 text-lg",
          // Color variants
          variant === "primary" && [
            "bg-gradient-to-r from-cyan to-blue text-navy-light",
            glow && "hover:shadow-[0_0_30px_rgba(39,243,214,0.5)] hover:scale-105",
          ],
          variant === "secondary" && [
            "bg-navy-lighter text-white border border-cyan/30",
            glow && "hover:border-cyan hover:shadow-[0_0_20px_rgba(39,243,214,0.3)] hover:scale-105",
          ],
          variant === "outline" && [
            "bg-transparent text-cyan border-2 border-cyan",
            glow && "hover:bg-cyan/10 hover:shadow-[0_0_20px_rgba(39,243,214,0.3)] hover:scale-105",
          ],
          variant === "ghost" && ["bg-transparent text-white/80", "hover:text-cyan hover:bg-cyan/10"],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
GlowButton.displayName = "GlowButton"

export { GlowButton }
