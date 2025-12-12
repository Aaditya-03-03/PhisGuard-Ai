"use client"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { EncryptedChip } from "@/components/ui/encrypted-chip"
import { AlertBox } from "@/components/ui/alert-box"
import { ArrowLeft, Mail, Clock, Hash, Shield, Brain, Link2, CheckCircle, Flag } from "lucide-react"

// Mock email data
const emailData = {
  id: "1",
  sender: "security-alert@bankofamerica.com",
  subject: "Urgent: Verify your account information immediately",
  timestamp: "2024-01-15 14:32:18 UTC",
  messageIdHash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  riskLevel: "high" as const,
  phishingProbability: 92,
  body: `Dear Valued Customer,

We have detected unusual activity on your Bank of America account. Your account access has been temporarily limited due to security concerns.

To restore full access to your account, please verify your identity by clicking the link below:

[VERIFY YOUR ACCOUNT NOW]

If you do not verify your account within 24 hours, your account will be permanently suspended.

Thank you for your prompt attention to this matter.

Sincerely,
Bank of America Security Team`,
  urls: [
    {
      encrypted: "aHR0cHM6Ly9zZWN1cmUtYmFua29mYW1lcmljYS5mYWtlLmNvbS92ZXJpZnk=",
      decrypted: "https://secure-bankofamerica.fake.com/verify",
      riskScore: 98,
    },
    {
      encrypted: "aHR0cHM6Ly90cmFja2luZy5tYWxpY2lvdXMuY29tL2NsaWNr",
      decrypted: "https://tracking.malicious.com/click",
      riskScore: 95,
    },
  ],
  aiInsights: {
    keywords: [
      { word: "Urgent", weight: 0.85 },
      { word: "Verify", weight: 0.82 },
      { word: "Account suspended", weight: 0.78 },
      { word: "Click here", weight: 0.75 },
      { word: "24 hours", weight: 0.72 },
    ],
    confidence: 94,
    model: "DistilBERT-Phishing-v2",
    analysisTime: "47ms",
  },
}

interface EmailAnalysisReportProps {
  emailId: string
}

export function EmailAnalysisReport({ emailId }: EmailAnalysisReportProps) {
  const [urlsRevealed, setUrlsRevealed] = useState(false)

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
                <p className="text-white font-medium">{emailData.sender}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
                <p className="text-white font-medium">{emailData.subject}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Timestamp
                </p>
                <p className="text-muted-foreground">{emailData.timestamp}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Message ID Hash
                </p>
                <p className="text-muted-foreground font-mono text-sm truncate">{emailData.messageIdHash}</p>
              </div>
            </div>

            {/* Risk level and probability */}
            <div className="mt-6 pt-6 border-t border-cyan/20 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Risk Level:</span>
                <NeonBadge variant="high" pulse>
                  HIGH RISK
                </NeonBadge>
              </div>
              <div className="flex-1 max-w-xs">
                <ProbabilityBar value={emailData.phishingProbability} label="Phishing Probability" size="lg" />
              </div>
            </div>
          </GlassCard>

          {/* Email body preview */}
          <GlassCard variant="strong">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan" />
              Email Body Preview
            </h2>
            <div className="bg-navy-lighter/50 rounded-xl p-4 max-h-64 overflow-y-auto border border-cyan/10">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">{emailData.body}</pre>
            </div>
          </GlassCard>

          {/* URL Analysis */}
          <GlassCard variant="strong">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-cyan" />
                Extracted URLs ({emailData.urls.length})
              </h2>
              <GlowButton variant="secondary" size="sm" onClick={() => setUrlsRevealed(!urlsRevealed)}>
                {urlsRevealed ? "Hide URLs" : "Decrypt URLs"}
              </GlowButton>
            </div>

            <AlertBox variant="warning" className="mb-4">
              These URLs have been identified as potentially malicious. Exercise caution.
            </AlertBox>

            <div className="space-y-3">
              {emailData.urls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-navy-lighter/50 rounded-xl border border-cyan/10"
                >
                  <EncryptedChip
                    value={url.encrypted}
                    decryptedValue={urlsRevealed ? url.decrypted : undefined}
                    className="flex-1"
                  />
                  <NeonBadge variant="high" className="ml-4">
                    {url.riskScore}% Risk
                  </NeonBadge>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right column - AI Insights */}
        <div className="space-y-6">
          {/* AI Insights */}
          <GlassCard variant="strong" glow="cyan">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan" />
              AI Insights
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Model:</span>
                <span className="text-cyan font-mono">{emailData.aiInsights.model}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="text-white font-bold">{emailData.aiInsights.confidence}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analysis Time:</span>
                <span className="text-risk-low">{emailData.aiInsights.analysisTime}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-cyan/20">
              <h3 className="text-sm font-semibold text-white mb-3">Key Indicators</h3>
              <div className="space-y-3">
                {emailData.aiInsights.keywords.map((keyword) => (
                  <div key={keyword.word} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{keyword.word}</span>
                      <span className="text-risk-high">{Math.round(keyword.weight * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-navy-lighter rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-risk-medium to-risk-high rounded-full"
                        style={{ width: `${keyword.weight * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <GlassCard variant="strong">
            <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              <GlowButton variant="secondary" className="w-full justify-start">
                <CheckCircle className="w-4 h-4" />
                Mark as Safe
              </GlowButton>
              <GlowButton variant="outline" className="w-full justify-start text-risk-high border-risk-high">
                <Flag className="w-4 h-4" />
                Report Email
              </GlowButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
