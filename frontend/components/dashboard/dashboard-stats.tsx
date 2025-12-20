"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Mail, AlertTriangle, ShieldAlert, Activity } from "lucide-react"
import { getEmailStats, type EmailStats } from "@/lib/api"

export function DashboardStats() {
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getEmailStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const safeEmails = stats.total - stats.highRisk - stats.mediumRisk

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard
        title="Total Emails Scanned"
        value={loading ? "..." : stats.total.toLocaleString()}
        subtitle="All processed emails"
        icon={Mail}
        variant="cyan"
        href="/dashboard/flagged?filter=all"
      />
      <StatCard
        title="High Risk (Phishing)"
        value={loading ? "..." : stats.highRisk.toLocaleString()}
        subtitle="Click to view threats"
        icon={AlertTriangle}
        variant="danger"
        href="/dashboard/flagged?filter=high"
      />
      <StatCard
        title="Medium Risk"
        value={loading ? "..." : stats.mediumRisk.toLocaleString()}
        subtitle="Click to review"
        icon={ShieldAlert}
        variant="warning"
        href="/dashboard/flagged?filter=medium"
      />
      <StatCard
        title="Low Risk Emails"
        value={loading ? "..." : safeEmails.toLocaleString()}
        subtitle="Click to view"
        icon={Activity}
        variant="success"
        href="/dashboard/flagged?filter=low"
      />
    </div>
  )
}
