"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { Search, Filter, Eye, RefreshCw, Inbox, Mail, Send } from "lucide-react"
import { getLatestScan, getResultsByPlatform, type Email, type PhishingResult } from "@/lib/api"
import type { Platform } from "@/components/dashboard/platform-selector"

interface FlaggedEmailsListProps {
  platform?: Platform
}

// Convert PhishingResult to Email format for display
function convertToEmail(result: PhishingResult): Email {
  return {
    id: result.id,
    gmailId: result.id,
    messageId: result.id,
    sender: `${result.platform}@phishguard`,
    senderName: result.platform.charAt(0).toUpperCase() + result.platform.slice(1) + " Message",
    subject: result.content.substring(0, 80) + (result.content.length > 80 ? "..." : ""),
    body: result.content,
    receivedAt: result.createdAt,
    processedAt: result.createdAt,
    riskLevel: result.risk,
    phishingScore: result.confidence,
    flags: result.reasons,
    urlCount: 0,
    urls: []
  }
}

export function FlaggedEmailsList({ platform = "email" }: FlaggedEmailsListProps) {
  const searchParams = useSearchParams()
  const initialFilter = (searchParams.get('filter') as "all" | "high" | "medium" | "low") || "all"

  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(initialFilter)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchFlaggedMessages = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    setLoading(true)

    try {
      let allEmails: Email[] = []

      if (platform === "email") {
        // Email uses existing scan history
        const { getScanHistory, getLatestScan } = await import("@/lib/api")
        const scanHistory = await getScanHistory(10)

        console.log(`[FlaggedMessages] Email scan history:`, scanHistory?.length, 'scans')

        if (scanHistory && scanHistory.length > 0) {
          const emailMap = new Map()
          scanHistory.forEach(scan => {
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

        // Fallback to latest scan
        if (allEmails.length === 0) {
          const latestScan = await getLatestScan()
          if (latestScan && latestScan.results) {
            allEmails = latestScan.results
          }
        }
      } else {
        // Telegram and WhatsApp use platform-specific endpoint
        console.log(`[FlaggedMessages] Fetching ${platform} results...`)
        const results = await getResultsByPlatform(platform, 100)
        console.log(`[FlaggedMessages] Got ${results.length} ${platform} results`)

        // Convert to Email format for display
        allEmails = results.map(convertToEmail)
      }

      console.log(`[FlaggedMessages] Total ${platform} messages:`, allEmails.length)
      setEmails(allEmails)
    } catch (error) {
      console.error(`Failed to fetch flagged ${platform} messages:`, error)
      setEmails([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [platform])

  useEffect(() => {
    fetchFlaggedMessages()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchFlaggedMessages(), 30000)
    return () => clearInterval(interval)
  }, [fetchFlaggedMessages])

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

  // Platform-specific labels
  const getPlatformLabels = () => {
    switch (platform) {
      case "telegram":
        return {
          searchPlaceholder: "Search Telegram messages...",
          emptyTitle: "No flagged Telegram messages",
          emptyMessage: "Messages scanned via the Telegram bot will appear here",
          icon: Send
        }
      default:
        return {
          searchPlaceholder: "Search emails...",
          emptyTitle: "No flagged emails found",
          emptyMessage: "Scan your inbox to detect phishing threats",
          icon: Mail
        }
    }
  }

  const labels = getPlatformLabels()
  const PlatformIcon = labels.icon

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
              placeholder={labels.searchPlaceholder}
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
              onClick={() => fetchFlaggedMessages(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      {/* Message cards */}
      {filteredEmails.length > 0 ? (
        <div className="grid gap-4">
          {filteredEmails.map((email, index) => {
            const riskLevel = email.riskLevel.toLowerCase() as 'low' | 'medium' | 'high'

            return (
              <GlassCard key={email.id || `message-${index}`} hover className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Message info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <NeonBadge variant={riskLevel}>
                        {riskLevel.toUpperCase()}
                      </NeonBadge>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {platform === "email"
                            ? (email.sender || email.senderName || 'Unknown sender')
                            : (email.senderName || 'Message')}
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
          <PlatformIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-white mb-2">{labels.emptyTitle}</p>
          <p className="text-muted-foreground">
            {searchQuery || filter !== "all"
              ? "No messages match your search criteria"
              : labels.emptyMessage}
          </p>
        </GlassCard>
      )}
    </div>
  )
}
