"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { AlertBox } from "@/components/ui/alert-box"
import { ArrowLeft, Mail, Clock, Hash, Shield, Brain, Link2, AlertTriangle, RefreshCw, Flag, FileText } from "lucide-react"
import { getScanHistory, getEmailById, type Email } from "@/lib/api"

interface EmailAnalysisReportProps {
  emailId: string
}

export function EmailAnalysisReport({ emailId }: EmailAnalysisReportProps) {
  const [email, setEmail] = useState<Email | null>(null)
  const [fullBody, setFullBody] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingBody, setLoadingBody] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmail() {
      try {
        // Get emails from scan history and find by ID
        const scanHistory = await getScanHistory(10)

        let foundEmail: Email | null = null

        for (const scan of scanHistory) {
          if (scan.results) {
            const match = scan.results.find((e: Email) =>
              e.id === emailId ||
              e.gmailId === emailId ||
              e.messageId === emailId
            )
            if (match) {
              foundEmail = match
              break
            }
          }
        }

        if (foundEmail) {
          setEmail(foundEmail)

          // Use body if already stored, otherwise try to fetch from Gmail
          if (foundEmail.body) {
            setFullBody(foundEmail.body)
          } else {
            // Try to fetch full email body from Gmail
            const gmailId = foundEmail.gmailId || foundEmail.id
            if (gmailId) {
              setLoadingBody(true)
              try {
                const fullEmail = await getEmailById(gmailId)
                if (fullEmail && fullEmail.body) {
                  setFullBody(fullEmail.body)
                }
              } catch (bodyErr) {
                console.log("Could not fetch full body:", bodyErr)
              } finally {
                setLoadingBody(false)
              }
            }
          }
        } else {
          setError("Email not found")
        }
      } catch (err) {
        console.error("Failed to fetch email:", err)
        setError("Failed to load email")
      } finally {
        setLoading(false)
      }
    }

    fetchEmail()
  }, [emailId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getRiskBadgeVariant = (level: string) => {
    const l = level.toLowerCase()
    if (l === 'high') return 'high'
    if (l === 'medium') return 'medium'
    return 'low'
  }

  if (loading) {
    return (
      <GlassCard className="p-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan mx-auto mb-4" />
        <p className="text-muted-foreground">Loading email analysis...</p>
      </GlassCard>
    )
  }

  if (error || !email) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/flagged">
          <GlowButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Flagged Emails
          </GlowButton>
        </Link>
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-risk-medium mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Email Not Found</h3>
          <p className="text-muted-foreground">{error || "The requested email could not be found."}</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/flagged">
        <GlowButton variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Flagged Emails
        </GlowButton>
      </Link>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Email details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata card */}
          <GlassCard variant="strong">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan" />
              Email Metadata
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sender</p>
                <p className="text-white font-medium">{email.sender}</p>
                {email.senderName && (
                  <p className="text-sm text-muted-foreground">{email.senderName}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
                <p className="text-white font-medium">{email.subject || "(No subject)"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Received
                </p>
                <p className="text-muted-foreground">{formatDate(email.receivedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Email ID
                </p>
                <p className="text-muted-foreground font-mono text-sm truncate">{email.gmailId || email.id}</p>
              </div>
            </div>

            {/* Risk level and probability */}
            <div className="mt-6 pt-6 border-t border-cyan/20 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Risk Level:</span>
                <NeonBadge variant={getRiskBadgeVariant(email.riskLevel)} pulse={email.riskLevel.toLowerCase() === 'high'}>
                  {email.riskLevel.toUpperCase()} RISK
                </NeonBadge>
              </div>
              <div className="flex-1 max-w-xs">
                <ProbabilityBar value={email.phishingScore} label="Phishing Probability" size="lg" />
              </div>
            </div>
          </GlassCard>

          {/* Email Content */}
          <GlassCard variant="strong">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan" />
              Email Content
            </h2>
            <div className="bg-navy-lighter/50 rounded-xl p-4 border border-cyan/10 max-h-96 overflow-y-auto">
              {loadingBody ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading full email content...
                </div>
              ) : fullBody ? (
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                  {fullBody}
                </pre>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Email Preview</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {email.snippet || "No preview available"}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* URL Analysis */}
          {email.urlCount > 0 && (
            <GlassCard variant="strong">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-cyan" />
                  URLs Detected ({email.urlCount})
                </h2>
              </div>

              <AlertBox variant="warning" className="mb-4">
                This email contains {email.urlCount} URL(s). URLs in suspicious emails may lead to phishing sites.
              </AlertBox>
            </GlassCard>
          )}
        </div>

        {/* Right column - Analysis */}
        <div className="space-y-6">
          {/* AI Insights */}
          <GlassCard variant="strong" glow="cyan">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan" />
              Detection Analysis
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Detection Model:</span>
                <span className="text-cyan font-mono">Rule-Based Detector</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phishing Score:</span>
                <span className="text-white font-bold">{email.phishingScore}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">URLs Found:</span>
                <span className={email.urlCount > 0 ? "text-risk-high" : "text-risk-low"}>
                  {email.urlCount}
                </span>
              </div>
            </div>

            {/* Flags/Indicators */}
            {email.flags && email.flags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-cyan/20">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Risk Indicators
                </h3>
                <div className="space-y-2">
                  {email.flags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-risk-medium mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Email Stats */}
          <GlassCard variant="strong">
            <h2 className="text-lg font-bold text-white mb-4">Email Statistics</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email ID:</span>
                <span className="text-white font-mono truncate max-w-[150px]">{email.id}</span>
              </div>
              {email.messageId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Message ID:</span>
                  <span className="text-white font-mono truncate max-w-[150px]">{email.messageId}</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
