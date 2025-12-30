"use client"

import { StatCard } from "@/components/ui/stat-card"
import { Mail, AlertTriangle, ShieldAlert, Activity, Send, MessageCircle } from "lucide-react"
import { useDashboardData } from "@/contexts/dashboard-data-context"
import type { Platform } from "@/components/dashboard/platform-selector"

interface DashboardStatsProps {
  platform?: Platform
}

export function DashboardStats({ platform = "email" }: DashboardStatsProps) {
  const { data } = useDashboardData()
  const { stats, isLoading, hasNewData } = data

  const safeCount = stats.total - stats.highRisk - stats.mediumRisk

  // Platform-specific labels
  const getLabels = () => {
    switch (platform) {
      case "telegram":
        return {
          total: "Total Telegram Messages",
          totalSub: "All scanned messages",
          high: "High Risk Messages",
          medium: "Medium Risk Messages",
          low: "Low Risk Messages",
          icon: Send
        }
      case "whatsapp":
        return {
          total: "WhatsApp Scans",
          totalSub: "Manually scanned messages",
          high: "High Risk Detected",
          medium: "Medium Risk Detected",
          low: "Low Risk Detected",
          icon: MessageCircle
        }
      default:
        return {
          total: "Total Emails Scanned",
          totalSub: "All processed emails",
          high: "High Risk (Phishing)",
          medium: "Medium Risk",
          low: "Low Risk Emails",
          icon: Mail
        }
    }
  }

  const labels = getLabels()
  const TotalIcon = labels.icon

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 transition-all duration-300 ${hasNewData ? 'ring-2 ring-cyan/50 rounded-xl' : ''}`}>
      <StatCard
        title={labels.total}
        value={isLoading ? "..." : stats.total.toLocaleString()}
        subtitle={labels.totalSub}
        icon={TotalIcon}
        variant="cyan"
        href={`/dashboard/flagged?filter=all&platform=${platform}`}
      />
      <StatCard
        title={labels.high}
        value={isLoading ? "..." : stats.highRisk.toLocaleString()}
        subtitle="Click to view threats"
        icon={AlertTriangle}
        variant="danger"
        href={`/dashboard/flagged?filter=high&platform=${platform}`}
      />
      <StatCard
        title={labels.medium}
        value={isLoading ? "..." : stats.mediumRisk.toLocaleString()}
        subtitle="Click to review"
        icon={ShieldAlert}
        variant="warning"
        href={`/dashboard/flagged?filter=medium&platform=${platform}`}
      />
      <StatCard
        title={labels.low}
        value={isLoading ? "..." : safeCount.toLocaleString()}
        subtitle="Click to view"
        icon={Activity}
        variant="success"
        href={`/dashboard/flagged?filter=low&platform=${platform}`}
      />
    </div>
  )
}
