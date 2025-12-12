"use client"

import { cn } from "@/lib/utils"
import { Lock, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

interface EncryptedChipProps {
  value: string
  decryptedValue?: string
  className?: string
}

export function EncryptedChip({ value, decryptedValue, className }: EncryptedChipProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  const displayValue = isRevealed && decryptedValue ? decryptedValue : value

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-navy-lighter/80 border border-cyan/20",
        "text-sm font-mono",
        className,
      )}
    >
      <Lock className="w-3.5 h-3.5 text-cyan" />
      <span className={cn("max-w-[200px] truncate transition-all duration-300", !isRevealed && "blur-sm select-none")}>
        {displayValue}
      </span>
      {decryptedValue && (
        <button onClick={() => setIsRevealed(!isRevealed)} className="p-1 rounded hover:bg-cyan/10 transition-colors">
          {isRevealed ? (
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  )
}
