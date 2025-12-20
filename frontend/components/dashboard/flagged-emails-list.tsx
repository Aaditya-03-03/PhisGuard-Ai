"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { Search, Filter, Eye, RefreshCw, Inbox } from "lucide-react"
import { getEmailsByRisk, getLatestScan, type Email } from "@/lib/api"

export function FlaggedEmailsList() {
  const searchParams = useSearchParams()
  const initialFilter = (searchParams.get('filter') as "all" | "high" | "medium" | "low") || "all"

  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(initialFilter)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchFlaggedEmails = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)

    try {
      // Get all emails from scan history (multiple scans)
      const { getScanHistory, getLatestScan } = await import("@/lib/api")
      const scanHistory = await getScanHistory(10) // Get last 10 scans

      console.log('[FlaggedEmails] Scan history:', scanHistory?.length, 'scans')

      let allEmails: Email[] = []

      if (scanHistory && scanHistory.length > 0) {
        // Combine all results from all scans, avoiding duplicates by emailId
        const emailMap = new Map()
        scanHistory.forEach(scan => {
          console.log('[FlaggedEmails] Scan has', scan.results?.length, 'results, summary:', scan.summary)
          if (scan.results && Array.isArray(scan.results)) {
            scan.results.forEach((email: Email) => {
              const key = email.gmailId || email.id || email.messageId || email.subject
              if (key && !emailMap.has(key)) {
                emailMap.set(key, email)
              }
            })
          }
        })
        allEmails = Array.from(emailMap.values())
      }

      // Fallback: also try latest scan if no emails found
      if (allEmails.length === 0) {
        console.log('[FlaggedEmails] Trying fallback to latest scan...')
        const latestScan = await getLatestScan()
        if (latestScan && latestScan.results) {
          allEmails = latestScan.results
        }
      }

      console.log('[FlaggedEmails] Total unique emails:', allEmails.length)
      console.log('[FlaggedEmails] High risk:', allEmails.filter(e => e.riskLevel?.toLowerCase() === 'high').length)
      setEmails(allEmails)
    } catch (error) {
      console.error('Failed to fetch flagged emails:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchFlaggedEmails()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchFlaggedEmails(), 30000)
    return () => clearInterval(interval)
  }, [fetchFlaggedEmails])

  const filteredEmails = emails.filter((email) => {
    const riskLevel = email.riskLevel.toLowerCase()
    const matchesFilter = filter === "all" || riskLevel === filter
    const matchesSearch =
      (email.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <GlassCard className="p-12">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan" />
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-navy-lighter/50 border border-cyan/20 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            {(["all", "high", "medium", "low"] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === filterOption
                  ? "bg-cyan/20 text-cyan border border-cyan/30"
                  : "text-muted-foreground hover:text-white hover:bg-navy-lighter"
                  }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
            <GlowButton
              variant="ghost"
              size="sm"
              onClick={() => fetchFlaggedEmails(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      {/* Email cards */}
      {filteredEmails.length > 0 ? (
        <div className="grid gap-4">
          {filteredEmails.map((email, index) => {
            const riskLevel = email.riskLevel.toLowerCase() as 'low' | 'medium' | 'high'

            return (
              <GlassCard key={email.id || `email-${index}`} hover className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Email info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <NeonBadge variant={riskLevel}>
                        {riskLevel.toUpperCase()}
                      </NeonBadge>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {email.sender || email.senderName || 'Unknown sender'}
                        </h3>
                        <p className="text-muted-foreground text-sm truncate">
                          {email.subject || 'No subject'}
                        </p>
                      </div>
                    </div>

                    {/* Flags/Keywords */}
                    {email.flags && email.flags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {email.flags.slice(0, 4).map((flag, flagIndex) => (
                          <span
                            key={`${flag}-${flagIndex}`}
                            className="px-2 py-1 bg-risk-high/10 text-risk-high text-xs rounded-md border border-risk-high/20"
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Risk score and actions */}
                  <div className="flex items-center gap-6">
                    <div className="w-32">
                      <ProbabilityBar value={email.phishingScore} label="Risk Score" size="md" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/flagged/${email.id || email.messageId}`}>
                        <GlowButton variant="secondary" size="sm">
                          <Eye className="w-4 h-4" />
                          View
                        </GlowButton>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-cyan/10 text-xs text-muted-foreground">
                  Received: {formatDate(email.receivedAt || email.processedAt || new Date().toISOString())}
                  {email.urlCount > 0 && (
                    <span className="ml-4">• {email.urlCount} URL{email.urlCount > 1 ? 's' : ''} detected</span>
                  )}
                </div>
              </GlassCard>
            )
          })}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-white mb-2">No flagged emails found</p>
          <p className="text-muted-foreground">
            {searchQuery || filter !== "all"
              ? "No emails match your search criteria"
              : "Scan your inbox to detect phishing threats"}
          </p>
        </GlassCard>
      )}
    </div>
  )
}
