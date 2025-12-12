"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CyberShield } from "@/components/ui/cyber-shield"
import { StatusIndicator } from "@/components/ui/status-indicator"
import {
  LayoutDashboard,
  AlertTriangle,
  FileBarChart,
  Settings,
  Mail,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

const sidebarLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/flagged", icon: AlertTriangle, label: "Flagged Emails" },
  { href: "/dashboard/reports", icon: FileBarChart, label: "Reports" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/connect-gmail", icon: Mail, label: "Connect Gmail" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useAuth()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3">
            <CyberShield size="sm" animated={false} />
            {!collapsed && (
              <span className="text-lg font-bold text-white">
                Phish<span className="text-cyan">Guard</span>
              </span>
            )}
          </Link>
        </div>

        {/* System Status */}
        <div className={cn("p-4 border-b border-sidebar-border", collapsed && "flex justify-center")}>
          <StatusIndicator status="online" label={collapsed ? undefined : "System Live"} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-cyan/10 text-cyan border border-cyan/30 shadow-[0_0_15px_rgba(39,243,214,0.2)]"
                    : "text-muted-foreground hover:text-white hover:bg-sidebar-accent",
                  collapsed && "justify-center px-2",
                )}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:text-risk-high hover:bg-risk-high/10 transition-colors",
              collapsed && "justify-center px-2",
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl w-full text-muted-foreground hover:text-white hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
