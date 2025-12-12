"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { GlowButton } from "@/components/ui/glow-button"
import { Eye, MoreHorizontal, RefreshCw, Inbox } from "lucide-react"
import { getEmails, type Email } from "@/lib/api"

export function RecentEmailsTable() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEmails = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const data = await getEmails(10)
      setEmails(data)
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchEmails()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchEmails(), 30000)
    return () => clearInterval(interval)
  }, [fetchEmails])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <GlassCard variant="strong">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Emails</h3>
        <div className="flex items-center gap-2">
          <GlowButton
            variant="ghost"
            size="sm"
            onClick={() => fetchEmails(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </GlowButton>
          <Link href="/dashboard/flagged">
            <GlowButton variant="secondary" size="sm">
              View All
            </GlowButton>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan" />
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No emails processed yet</p>
            <p className="text-sm">Emails will appear here once n8n starts sending them</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan/20">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sender
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan/10">
              {emails.map((email) => (
                <tr key={email.id} className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm text-white font-medium truncate max-w-[200px] block">
                      {email.sender || email.senderName || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-muted-foreground truncate max-w-[300px] block">
                      {email.subject || 'No subject'}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(email.receivedAt || email.processedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-24">
                      <ProbabilityBar value={email.phishingScore} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <NeonBadge variant={email.riskLevel}>
                      {email.riskLevel.toUpperCase()}
                    </NeonBadge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/flagged/${email.id}`}>
                        <button className="p-2 rounded-lg hover:bg-cyan/10 text-muted-foreground hover:text-cyan transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <button className="p-2 rounded-lg hover:bg-cyan/10 text-muted-foreground hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </GlassCard>
  )
}

