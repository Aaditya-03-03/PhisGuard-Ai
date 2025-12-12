import type React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"

interface AlertBoxProps {
  variant: "info" | "warning" | "success" | "error"
  title?: string
  children: React.ReactNode
  className?: string
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
}

export function AlertBox({ variant, title, children, className }: AlertBoxProps) {
  const Icon = icons[variant]

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-xl border",
        variant === "info" && "bg-blue/10 border-blue/30 text-blue",
        variant === "warning" && "bg-risk-medium/10 border-risk-medium/30 text-risk-medium",
        variant === "success" && "bg-risk-low/10 border-risk-low/30 text-risk-low",
        variant === "error" && "bg-risk-high/10 border-risk-high/30 text-risk-high",
        className,
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  )
}
