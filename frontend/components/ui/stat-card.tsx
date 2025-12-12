import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "cyan" | "blue" | "success" | "warning" | "danger"
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: StatCardProps) {
  return (
    <GlassCard hover className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight",
              variant === "cyan" && "text-cyan glow-text-cyan",
              variant === "blue" && "text-blue glow-text-blue",
              variant === "success" && "text-risk-low",
              variant === "warning" && "text-risk-medium",
              variant === "danger" && "text-risk-high",
              variant === "default" && "text-white",
            )}
          >
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-sm font-medium", trend.isPositive ? "text-risk-low" : "text-risk-high")}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-xl",
            variant === "cyan" && "bg-cyan/20 text-cyan",
            variant === "blue" && "bg-blue/20 text-blue",
            variant === "success" && "bg-risk-low/20 text-risk-low",
            variant === "warning" && "bg-risk-medium/20 text-risk-medium",
            variant === "danger" && "bg-risk-high/20 text-risk-high",
            variant === "default" && "bg-white/10 text-white/80",
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {/* Decorative glow */}
      <div
        className={cn(
          "absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20",
          variant === "cyan" && "bg-cyan",
          variant === "blue" && "bg-blue",
          variant === "success" && "bg-risk-low",
          variant === "warning" && "bg-risk-medium",
          variant === "danger" && "bg-risk-high",
          variant === "default" && "bg-white",
        )}
      />
    </GlassCard>
  )
}
