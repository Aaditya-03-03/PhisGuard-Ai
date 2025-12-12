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
      />
      <StatCard
        title="High Risk (Phishing)"
        value={loading ? "..." : stats.highRisk.toLocaleString()}
        subtitle="Detected threats"
        icon={AlertTriangle}
        variant="danger"
      />
      <StatCard
        title="Medium Risk"
        value={loading ? "..." : stats.mediumRisk.toLocaleString()}
        subtitle="Needs review"
        icon={ShieldAlert}
        variant="warning"
      />
      <StatCard
        title="Safe Emails"
        value={loading ? "..." : safeEmails.toLocaleString()}
        subtitle="Low risk"
        icon={Activity}
        variant="success"
      />
    </div>
  )
}

