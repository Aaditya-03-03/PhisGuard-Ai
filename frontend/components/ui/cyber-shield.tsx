import { cn } from "@/lib/utils"

interface CyberShieldProps {
  size?: "sm" | "md" | "lg" | "xl"
  animated?: boolean
  className?: string
}

export function CyberShield({ size = "md", animated = true, className }: CyberShieldProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer glow */}
      <div className={cn("absolute inset-0 rounded-full bg-cyan/20 blur-xl", animated && "animate-glow-pulse")} />

      {/* Shield SVG */}
      <svg viewBox="0 0 100 100" className={cn("relative w-full h-full", animated && "animate-float")}>
        {/* Shield body */}
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27F3D6" />
            <stop offset="100%" stopColor="#3A86FF" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shield outline */}
        <path
          d="M50 10 L85 25 L85 50 Q85 75 50 90 Q15 75 15 50 L15 25 Z"
          fill="none"
          stroke="url(#shieldGradient)"
          strokeWidth="2"
          filter="url(#glow)"
        />

        {/* Inner shield */}
        <path
          d="M50 18 L78 30 L78 50 Q78 70 50 82 Q22 70 22 50 L22 30 Z"
          fill="rgba(39, 243, 214, 0.1)"
          stroke="rgba(39, 243, 214, 0.3)"
          strokeWidth="1"
        />

        {/* AI brain icon */}
        <circle cx="50" cy="45" r="12" fill="none" stroke="#27F3D6" strokeWidth="1.5" />
        <circle cx="45" cy="43" r="2" fill="#27F3D6" />
        <circle cx="55" cy="43" r="2" fill="#27F3D6" />
        <path d="M43 50 Q50 55 57 50" fill="none" stroke="#27F3D6" strokeWidth="1.5" />

        {/* Circuit lines */}
        <path d="M50 57 L50 65" stroke="#3A86FF" strokeWidth="1" />
        <circle cx="50" cy="67" r="2" fill="#3A86FF" />
        <path d="M35 35 L30 30" stroke="#27F3D6" strokeWidth="0.5" opacity="0.5" />
        <path d="M65 35 L70 30" stroke="#27F3D6" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  )
}
