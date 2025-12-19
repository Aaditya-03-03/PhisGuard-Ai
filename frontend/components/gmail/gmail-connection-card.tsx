"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { AlertBox } from "@/components/ui/alert-box"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { NeonBadge } from "@/components/ui/neon-badge"
import { Mail, Shield, CheckCircle, ArrowRight, Lock, Scan, Eye, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getGmailConnectUrl, checkGmailStatus } from "@/lib/api"

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
    title: "Scan Your Inbox",
    description: "Click scan to analyze emails for phishing",
    icon: Scan,
  },
]

export function GmailConnectionCard() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check connection status on mount and after OAuth callback
  useEffect(() => {
    async function checkStatus() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const status = await checkGmailStatus()
        setIsConnected(status.connected)

        // Check for callback parameters
        const gmailConnected = searchParams.get('gmail_connected')
        const errorParam = searchParams.get('error')

        if (gmailConnected === 'true') {
          setIsConnected(true)
        }

        if (errorParam) {
          setError(decodeURIComponent(errorParam))
        }
      } catch (err) {
        console.error('Failed to check Gmail status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()
  }, [user, searchParams])

  const handleConnect = () => {
    if (!user) {
      setError('Please sign in first to connect Gmail')
      return
    }

    setIsConnecting(true)
    setError(null)

    // Redirect to OAuth flow
    const connectUrl = getGmailConnectUrl(user.uid)
    window.location.href = connectUrl
  }

  if (isLoading) {
    return (
      <GlassCard variant="strong" className="p-8">
        <div className="text-center py-8">
          <div className="animate-spin w-10 h-10 border-4 border-cyan/30 border-t-cyan rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Checking Gmail connection status...</p>
        </div>
      </GlassCard>
    )
  }

  if (!user) {
    return (
      <GlassCard variant="strong" className="p-8">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to connect your Gmail account</p>
          <GlowButton variant="primary" onClick={() => (window.location.href = "/login")}>
            Go to Login
          </GlowButton>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan/20 to-blue/20 flex items-center justify-center border border-cyan/30 glow-cyan">
          <Mail className="w-10 h-10 text-cyan" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Connect Your Gmail Account</h1>
        <p className="text-lg text-muted-foreground">Enable phishing detection for your inbox</p>
      </div>

      {/* Error Alert */}
      {error && (
        <AlertBox variant="error" title="Connection Error">
          {error}
        </AlertBox>
      )}

      {/* Main Card */}
      <GlassCard variant="strong" className="p-8">
        {isConnected ? (
          /* Connected State */
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-risk-low/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-risk-low" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Gmail Connected!</h2>
            <p className="text-muted-foreground mb-6">Your account is ready for phishing scans</p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <StatusIndicator status="online" />
              <span className="text-risk-low font-medium">Ready to Scan</span>
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
              {steps.map((step) => (
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
                  Redirecting to Google...
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
        Your Gmail OAuth tokens are securely stored and encrypted. We only request read-only access to scan
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

