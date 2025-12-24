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

// Strip HTML tags, CSS, and extract clean text from email content
function htmlToCleanText(html: string): string {
  if (!html) return ''

  let text = html
    // Remove style blocks completely (including content)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove script blocks completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove head section
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')

    // REMOVE JUNK ENTITIES
    .replace(/&zwnj;/gi, '')  // Zero-width non-joiner
    .replace(/&zwj;/gi, '')   // Zero-width joiner
    .replace(/&#8204;/g, '')  // Numeric zero-width non-joiner
    .replace(/&#8205;/g, '')  // Numeric zero-width joiner
    .replace(/\u200C/g, '')   // Unicode zero-width non-joiner
    .replace(/\u200D/g, '')   // Unicode zero-width joiner

    // REMOVE CSS CLASS NAME LISTS (like ".btn-14 .c-white .c-primary")
    .replace(/(\.[a-z][\w-]*\s*)+/gi, ' ')
    // Remove #id patterns
    .replace(/(#[a-z][\w-]*\s*)+/gi, ' ')
    // Remove CSS selectors like "96 Reddit #MessageViewBody"
    .replace(/\d+\s+\w+\s+#\w+/g, '')
    .replace(/\d+\s+\w+\s+\.\w+/g, '')

    // AGGRESSIVE CSS REMOVAL - Remove CSS rules like ".class { property: value; }"
    .replace(/[.#@]?[\w-]+\s*\{[^}]*\}/g, '')
    // Remove CSS selectors with multiple rules
    .replace(/[\w\s,.\-#@:[\]()>+~*="']+\s*\{[^}]*\}/g, '')
    // Remove remaining CSS-like patterns
    .replace(/\{[^}]*\}/g, '')
    // Remove CSS media queries
    .replace(/@media[^{]*\{[\s\S]*?\}\s*\}/gi, '')
    // Remove CSS properties that might still remain (property: value;)
    .replace(/[\w-]+\s*:\s*[^;]+!important\s*;?/gi, '')
    // Remove patterns like "96 Reddit sup"
    .replace(/^\d+\s+\w+\s+\w+\s+/gm, '')
    // Remove lone CSS comments
    .replace(/\/\*[\s\S]*?\*\//g, '')

    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&bull;/gi, '• ')
    .replace(/&#(\d+);/gi, (_, num) => String.fromCharCode(parseInt(num)))
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .split('\n')
    .map(line => line.trim())
    // Filter out lines that look like CSS or code
    .filter(line => {
      if (line.length === 0) return false
      if (line.length < 3) return false // Skip very short lines
      // Skip lines that are just CSS class names
      if (/^(\.[a-z][\w-]*\s*)+$/i.test(line)) return false
      // Skip lines that look like CSS
      if (/^\s*[.#]?[\w-]+\s*\{/.test(line)) return false
      if (/:\s*[^;]+;/.test(line) && /{/.test(line)) return false
      if (/!important/.test(line)) return false
      if (/^[a-z-]+\s*:\s*\d+px/.test(line)) return false
      if (/^\/\*/.test(line)) return false
      // Skip lines that are mostly special characters
      if (/^[\s\W]*$/.test(line)) return false
      return true
    })
    .join('\n')

  return text.trim()
}

// Sanitize HTML for safe rendering (when we want to show formatted HTML)
function sanitizeHtml(html: string): string {
  // Remove dangerous content but keep formatting
  let safe = html
    // Remove style blocks (CSS code)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    // Remove iframes, objects, embeds
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    // Remove head section
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
  return safe
}


// Format plain text email body for better readability
function formatEmailBody(body: string): string {
  if (!body) return ''

  let formatted = body
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    // Decode numeric HTML entities
    .replace(/&#(\d+);/gi, (_, num) => String.fromCharCode(parseInt(num)))
    // Convert bullet points to proper line breaks
    .replace(/•/g, '\n• ')
    .replace(/&bull;/gi, '\n• ')
    .replace(/\*\s+/g, '\n• ')
    // Add line breaks before common section headers
    .replace(/(Key Takeaways)/gi, '\n\n$1')
    .replace(/(Sector Performance)/gi, '\n\n$1')
    .replace(/(Global Market)/gi, '\n\n$1')
    .replace(/(Technical Outlook)/gi, '\n\n$1')
    .replace(/(Chart Insight)/gi, '\n\n$1')
    .replace(/(Market Charcha)/gi, '\n\n$1')
    .replace(/(Dear [A-Za-z]+)/gi, '$1\n\n')
    // Add line breaks after colons in headers
    .replace(/:\s*([A-Z])/g, ':\n$1')
    // Put URLs on their own lines for better readability
    .replace(/(https?:\/\/[^\s]+)/gi, '\n🔗 $1\n')
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')

  return formatted.trim()
}

// Truncate long URLs for display
function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url
  const start = url.substring(0, 30)
  const end = url.substring(url.length - 15)
  return `${start}...${end}`
}

// Component to render text with clickable links
function TextWithLinks({ text }: { text: string }) {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/gi
  const parts = text.split(urlPattern)

  return (
    <>
      {parts.map((part, index) => {
        if (urlPattern.test(part)) {
          // Reset regex lastIndex
          urlPattern.lastIndex = 0
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-600 hover:text-blue-800 hover:underline break-all text-sm bg-blue-50 px-2 py-1 rounded my-1"
              title={part}
            >
              🔗 {truncateUrl(part)}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

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

          {/* Email Content - Styled like a real email */}
          <GlassCard variant="strong">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan" />
              Email Content
            </h2>

            {/* Email header bar - like a real email client */}
            <div className="bg-gray-900/80 rounded-t-xl p-4 border border-cyan/10 border-b-0">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">From:</span>
                  <span className="text-white font-medium">
                    {email.senderName ? `${email.senderName} <${email.sender}>` : email.sender}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Subject:</span>
                  <span className="text-white font-semibold">{email.subject || "(No subject)"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Date:</span>
                  <span className="text-muted-foreground">{formatDate(email.receivedAt)}</span>
                </div>
              </div>
            </div>

            {/* Email body - clean white background like real email */}
            <div className="bg-white rounded-b-xl shadow-inner overflow-hidden">
              <div className="p-6 max-h-[500px] overflow-y-auto">
                {loadingBody ? (
                  <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading full email content...</span>
                  </div>
                ) : (() => {
                  // Determine the content to display and clean it
                  const rawContent = fullBody || email.body || email.htmlBody || email.snippet || ''

                  // Check if content looks like HTML or contains CSS
                  // CSS patterns: { property: value; } or !important or color:#fff
                  const hasCss = /\{[^}]*:[^}]*\}/.test(rawContent) ||
                    /!important/i.test(rawContent) ||
                    /:\s*#[a-f0-9]{3,6}/i.test(rawContent) ||
                    /\d+px/.test(rawContent)
                  const hasHtml = /<[^>]+>/.test(rawContent)

                  // Always clean content if it has HTML or CSS
                  const cleanContent = (hasCss || hasHtml)
                    ? htmlToCleanText(rawContent)
                    : formatEmailBody(rawContent)

                  if (!cleanContent) {
                    return (
                      <div className="text-gray-500 text-center py-8">
                        No email content available
                      </div>
                    )
                  }

                  return (
                    <div className="text-gray-800 text-base leading-relaxed font-sans space-y-4">
                      {cleanContent.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="whitespace-pre-wrap">
                          <TextWithLinks text={paragraph} />
                        </p>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Custom styles for HTML email content */}
            <style jsx global>{`
              .email-html-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              }
              .email-html-content a {
                color: #0066cc;
                text-decoration: underline;
              }
              .email-html-content img {
                max-width: 100%;
                height: auto;
              }
              .email-html-content table {
                border-collapse: collapse;
                width: 100%;
              }
              .email-html-content td, .email-html-content th {
                padding: 8px;
              }
              .email-html-content p {
                margin-bottom: 1em;
              }
            `}</style>
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
