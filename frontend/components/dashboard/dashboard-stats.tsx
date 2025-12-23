"use client"

import { StatCard } from "@/components/ui/stat-card"
import { Mail, AlertTriangle, ShieldAlert, Activity } from "lucide-react"
import { useDashboardData } from "@/contexts/dashboard-data-context"

export function DashboardStats() {
  const { data } = useDashboardData()
  const { stats, isLoading, hasNewData } = data

  const safeEmails = stats.total - stats.highRisk - stats.mediumRisk

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 transition-all duration-300 ${hasNewData ? 'ring-2 ring-cyan/50 rounded-xl' : ''}`}>
      <StatCard
        title="Total Emails Scanned"
        value={isLoading ? "..." : stats.total.toLocaleString()}
        subtitle="All processed emails"
        icon={Mail}
        variant="cyan"
        href="/dashboard/flagged?filter=all"
      />
      <StatCard
        title="High Risk (Phishing)"
        value={isLoading ? "..." : stats.highRisk.toLocaleString()}
        subtitle="Click to view threats"
        icon={AlertTriangle}
        variant="danger"
        href="/dashboard/flagged?filter=high"
      />
      <StatCard
        title="Medium Risk"
        value={isLoading ? "..." : stats.mediumRisk.toLocaleString()}
        subtitle="Click to review"
        icon={ShieldAlert}
        variant="warning"
        href="/dashboard/flagged?filter=medium"
      />
      <StatCard
        title="Low Risk Emails"
        value={isLoading ? "..." : safeEmails.toLocaleString()}
        subtitle="Click to view"
        icon={Activity}
        variant="success"
        href="/dashboard/flagged?filter=low"
      />
    </div>
  )
}
