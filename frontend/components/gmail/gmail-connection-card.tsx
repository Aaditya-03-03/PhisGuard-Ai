"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { AlertBox } from "@/components/ui/alert-box"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { NeonBadge } from "@/components/ui/neon-badge"
import { Mail, Shield, CheckCircle, ArrowRight, Lock, Workflow, Eye } from "lucide-react"

const steps = [
  {
    number: 1,
    title: 'Click "Authorize Gmail"',
    description: "Initiate the secure OAuth 2.0 flow",
    icon: Mail,
  },
  {
    number: 2,
    title: "Grant Gmail Read Permission",
    description: "Allow read-only access to scan emails",
    icon: Eye,
  },
  {
    number: 3,
    title: "Automatic Scanning Begins",
    description: "n8n workflows start processing emails",
    icon: Workflow,
  },
]

export function GmailConnectionCard() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsConnecting(false)
    setIsConnected(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan/20 to-blue/20 flex items-center justify-center border border-cyan/30 glow-cyan">
          <Mail className="w-10 h-10 text-cyan" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Connect Your Gmail Account</h1>
        <p className="text-lg text-muted-foreground">Allow automated scanning of incoming emails using n8n workflows</p>
      </div>

      {/* Main Card */}
      <GlassCard variant="strong" className="p-8">
        {isConnected ? (
          /* Connected State */
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-risk-low/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-risk-low" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Gmail Connected!</h2>
            <p className="text-muted-foreground mb-6">Your inbox is now being monitored for phishing threats</p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <StatusIndicator status="online" />
              <span className="text-risk-low font-medium">Scanning Active</span>
            </div>
            <GlowButton variant="primary" onClick={() => (window.location.href = "/dashboard")}>
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </GlowButton>
          </div>
        ) : (
          /* Connection Steps */
          <>
            {/* Steps */}
            <div className="space-y-4 mb-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-blue/20 flex items-center justify-center border border-cyan/30">
                    <span className="text-lg font-bold text-cyan">{step.number}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <step.icon className="w-5 h-5 text-cyan/50 mt-2" />
                </div>
              ))}
            </div>

            {/* Connect Button */}
            <GlowButton variant="primary" size="lg" className="w-full" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Connecting...
                </span>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Authorize Gmail
                </>
              )}
            </GlowButton>
          </>
        )}
      </GlassCard>

      {/* Security Info */}
      <AlertBox variant="info" title="Your data is secure">
        Your Gmail OAuth tokens are securely stored and encrypted with AES-256. We only request read-only access to scan
        emails for phishing threats. Your data is never shared with third parties.
      </AlertBox>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-4">
        <NeonBadge variant="cyan">
          <Lock className="w-3 h-3" />
          OAuth 2.0
        </NeonBadge>
        <NeonBadge variant="blue">
          <Shield className="w-3 h-3" />
          AES-256 Encrypted
        </NeonBadge>
        <NeonBadge variant="cyan">
          <Eye className="w-3 h-3" />
          Read-Only Access
        </NeonBadge>
      </div>
    </div>
  )
}
