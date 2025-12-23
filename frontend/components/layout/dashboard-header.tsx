"use client"

import { NeonBadge } from "@/components/ui/neon-badge"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"
import { Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { user } = useAuth()

  // Get user's display name or email
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <NeonBadge variant="cyan" pulse>
            LIVE
          </NeonBadge>
        </div>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search emails..."
            className="pl-10 pr-4 py-2 w-64 bg-navy-lighter/50 border border-cyan/20 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30"
          />
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User */}
        <button className="flex items-center gap-3 p-2 rounded-xl bg-navy-lighter/50 hover:bg-navy-lighter transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-blue flex items-center justify-center">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-navy">{initials}</span>
            )}
          </div>
          <span className="hidden md:block text-sm font-medium text-white">{displayName}</span>
        </button>
      </div>
    </header>
  )
}

