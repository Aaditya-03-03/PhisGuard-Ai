import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "online" | "offline" | "idle" | "warning"
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StatusIndicator({ status, label, size = "md", className }: StatusIndicatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative rounded-full",
          size === "sm" && "w-2 h-2",
          size === "md" && "w-3 h-3",
          size === "lg" && "w-4 h-4",
          status === "online" && "bg-risk-low shadow-[0_0_8px_rgba(46,213,115,0.8)]",
          status === "offline" && "bg-risk-high shadow-[0_0_8px_rgba(255,71,87,0.8)]",
          status === "idle" && "bg-risk-medium shadow-[0_0_8px_rgba(255,165,2,0.8)]",
          status === "warning" && "bg-risk-medium shadow-[0_0_8px_rgba(255,165,2,0.8)]",
        )}
      >
        {status === "online" && <span className="absolute inset-0 rounded-full bg-risk-low animate-ping opacity-75" />}
      </span>
      {label && (
        <span
          className={cn(
            "font-medium",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            status === "online" && "text-risk-low",
            status === "offline" && "text-risk-high",
            status === "idle" && "text-risk-medium",
            status === "warning" && "text-risk-medium",
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}
