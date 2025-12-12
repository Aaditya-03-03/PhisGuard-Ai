"use client"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { Search, Filter, Eye, CheckCircle, AlertTriangle } from "lucide-react"

const flaggedEmails = [
  {
    id: "1",
    sender: "security-alert@bankofamerica.com",
    subject: "Urgent: Verify your account information immediately",
    date: "2024-01-15 14:32",
    riskScore: 92,
    status: "high",
    keywords: ["urgent", "verify", "account", "immediately"],
  },
  {
    id: "2",
    sender: "admin@paypa1.com",
    subject: "Action Required: Confirm your payment details",
    date: "2024-01-15 12:18",
    riskScore: 97,
    status: "high",
    keywords: ["action required", "confirm", "payment"],
  },
  {
    id: "3",
    sender: "support@microsoft.com",
    subject: "Your Microsoft 365 subscription renewal",
    date: "2024-01-15 11:02",
    riskScore: 45,
    status: "medium",
    keywords: ["subscription", "renewal"],
  },
  {
    id: "4",
    sender: "urgent-security@g00gle.com",
    subject: "Your account has been compromised - Act now!",
    date: "2024-01-15 08:15",
    riskScore: 98,
    status: "high",
    keywords: ["compromised", "act now", "urgent"],
  },
  {
    id: "5",
    sender: "prize@lottery-winner.net",
    subject: "Congratulations! You've won $1,000,000",
    date: "2024-01-14 22:45",
    riskScore: 99,
    status: "high",
    keywords: ["congratulations", "won", "prize"],
  },
  {
    id: "6",
    sender: "hr@company-update.info",
    subject: "Important: Update your direct deposit information",
    date: "2024-01-14 16:30",
    riskScore: 78,
    status: "high",
    keywords: ["important", "update", "direct deposit"],
  },
]

export function FlaggedEmailsList() {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEmails = flaggedEmails.filter((email) => {
    const matchesFilter = filter === "all" || email.status === filter
    const matchesSearch =
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === filterOption
                    ? "bg-cyan/20 text-cyan border border-cyan/30"
                    : "text-muted-foreground hover:text-white hover:bg-navy-lighter"
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Email cards */}
      <div className="grid gap-4">
        {filteredEmails.map((email) => (
          <GlassCard key={email.id} hover className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Email info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-2">
                  <NeonBadge variant={email.status === "high" ? "high" : email.status === "medium" ? "medium" : "low"}>
                    {email.status.toUpperCase()}
                  </NeonBadge>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{email.sender}</h3>
                    <p className="text-muted-foreground text-sm truncate">{email.subject}</p>
                  </div>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {email.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-1 bg-risk-high/10 text-risk-high text-xs rounded-md border border-risk-high/20"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Risk score and actions */}
              <div className="flex items-center gap-6">
                <div className="w-32">
                  <ProbabilityBar value={email.riskScore} label="Risk Score" size="md" />
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/flagged/${email.id}`}>
                    <GlowButton variant="secondary" size="sm">
                      <Eye className="w-4 h-4" />
                      View
                    </GlowButton>
                  </Link>
                  <GlowButton variant="ghost" size="sm">
                    <CheckCircle className="w-4 h-4" />
                  </GlowButton>
                  <GlowButton variant="ghost" size="sm">
                    <AlertTriangle className="w-4 h-4" />
                  </GlowButton>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-cyan/10 text-xs text-muted-foreground">
              Received: {email.date}
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredEmails.length === 0 && (
        <GlassCard className="p-12 text-center">
          <p className="text-muted-foreground">No emails match your search criteria</p>
        </GlassCard>
      )}
    </div>
  )
}
