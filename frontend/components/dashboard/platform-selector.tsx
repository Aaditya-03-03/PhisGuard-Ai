"use client"

import { cn } from "@/lib/utils"
import { Mail, MessageCircle, Send } from "lucide-react"

// ============================================
// TYPES
// ============================================

export type Platform = "email" | "telegram" | "whatsapp"

export interface PlatformConfig {
    id: Platform
    label: string
    icon: React.ReactNode
    description?: string
}

export interface PlatformSelectorProps {
    /** Available platforms to show */
    platforms: PlatformConfig[]
    /** Currently selected platform */
    selected: Platform
    /** Callback when platform changes */
    onChange: (platform: Platform) => void
    /** Optional className for container */
    className?: string
}

// ============================================
// PLATFORM CONFIGURATIONS
// ============================================

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
    email: {
        id: "email",
        label: "Email",
        icon: <Mail className="w-4 h-4" />,
        description: "Gmail phishing detection"
    },
    telegram: {
        id: "telegram",
        label: "Telegram",
        icon: <Send className="w-4 h-4" />,
        description: "Automatic bot scanning"
    },
    whatsapp: {
        id: "whatsapp",
        label: "WhatsApp",
        icon: <MessageCircle className="w-4 h-4" />,
        description: "Manual message scanning"
    }
}

// Dashboard: All platforms
export const DASHBOARD_PLATFORMS: PlatformConfig[] = [
    PLATFORM_CONFIGS.email,
    PLATFORM_CONFIGS.telegram,
    PLATFORM_CONFIGS.whatsapp
]

// Flagged Messages: Only email and telegram (no whatsapp)
export const FLAGGED_PLATFORMS: PlatformConfig[] = [
    PLATFORM_CONFIGS.email,
    PLATFORM_CONFIGS.telegram
]

// Reports: Only email and telegram (no whatsapp)
export const REPORTS_PLATFORMS: PlatformConfig[] = [
    PLATFORM_CONFIGS.email,
    PLATFORM_CONFIGS.telegram
]

// ============================================
// COMPONENT
// ============================================

export function PlatformSelector({
    platforms,
    selected,
    onChange,
    className
}: PlatformSelectorProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {platforms.map((platform) => {
                const isSelected = platform.id === selected

                return (
                    <button
                        key={platform.id}
                        onClick={() => onChange(platform.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                            "border font-medium text-sm",
                            isSelected
                                ? "bg-cyan/10 text-cyan border-cyan/30 shadow-[0_0_15px_rgba(39,243,214,0.15)]"
                                : "bg-sidebar-accent/50 text-muted-foreground border-sidebar-border hover:text-white hover:bg-sidebar-accent"
                        )}
                        title={platform.description}
                    >
                        {platform.icon}
                        <span>{platform.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

// ============================================
// COMPACT VARIANT (for smaller spaces)
// ============================================

export function PlatformSelectorCompact({
    platforms,
    selected,
    onChange,
    className
}: PlatformSelectorProps) {
    return (
        <div className={cn("inline-flex rounded-lg border border-sidebar-border overflow-hidden", className)}>
            {platforms.map((platform, index) => {
                const isSelected = platform.id === selected

                return (
                    <button
                        key={platform.id}
                        onClick={() => onChange(platform.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 transition-all duration-200",
                            "text-sm font-medium",
                            index > 0 && "border-l border-sidebar-border",
                            isSelected
                                ? "bg-cyan/10 text-cyan"
                                : "text-muted-foreground hover:text-white hover:bg-sidebar-accent/50"
                        )}
                        title={platform.description}
                    >
                        {platform.icon}
                        <span className="hidden sm:inline">{platform.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
