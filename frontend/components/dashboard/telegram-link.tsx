"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { Send, Link2, Unlink, Copy, Check, Loader2, RefreshCw } from "lucide-react"
import {
    generateTelegramLinkCode,
    getTelegramLinkStatus,
    unlinkTelegram
} from "@/lib/api"

// ============================================
// TYPES
// ============================================

interface LinkStatus {
    linked: boolean
    chatId?: string
}

interface LinkingCode {
    code: string
    expiresAt: Date
}

// ============================================
// COMPONENT
// ============================================

export function TelegramLink() {
    const [status, setStatus] = useState<LinkStatus | null>(null)
    const [linkingCode, setLinkingCode] = useState<LinkingCode | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isUnlinking, setIsUnlinking] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number>(0)

    // Fetch initial link status
    useEffect(() => {
        fetchStatus()
    }, [])

    // Countdown timer for linking code
    useEffect(() => {
        if (!linkingCode) {
            setTimeLeft(0)
            return
        }

        const updateTimeLeft = () => {
            const now = new Date()
            const remaining = Math.max(0, Math.floor((linkingCode.expiresAt.getTime() - now.getTime()) / 1000))
            setTimeLeft(remaining)

            if (remaining === 0) {
                setLinkingCode(null)
            }
        }

        updateTimeLeft()
        const interval = setInterval(updateTimeLeft, 1000)
        return () => clearInterval(interval)
    }, [linkingCode])

    const fetchStatus = async () => {
        try {
            setIsLoading(true)
            const result = await getTelegramLinkStatus()
            setStatus(result)
        } catch (err) {
            setError("Failed to check link status")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateCode = async () => {
        try {
            setIsGenerating(true)
            setError(null)

            const result = await generateTelegramLinkCode()
            setLinkingCode({
                code: result.code,
                expiresAt: new Date(result.expiresAt)
            })
        } catch (err) {
            setError("Failed to generate linking code")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleUnlink = async () => {
        try {
            setIsUnlinking(true)
            setError(null)

            const success = await unlinkTelegram()
            if (success) {
                setStatus({ linked: false })
                setLinkingCode(null)
            } else {
                setError("Failed to unlink account")
            }
        } catch (err) {
            setError("Failed to unlink account")
        } finally {
            setIsUnlinking(false)
        }
    }

    const handleCopyCode = async () => {
        if (!linkingCode) return

        try {
            await navigator.clipboard.writeText(`/link ${linkingCode.code}`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const input = document.createElement("input")
            input.value = `/link ${linkingCode.code}`
            document.body.appendChild(input)
            input.select()
            document.execCommand("copy")
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    if (isLoading) {
        return (
            <GlassCard className="p-6">
                <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan" />
                    <span className="text-muted-foreground">Checking link status...</span>
                </div>
            </GlassCard>
        )
    }

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-cyan" />
                    <h3 className="text-lg font-semibold text-white">Telegram Integration</h3>
                </div>

                {status?.linked && (
                    <NeonBadge variant="low">Linked</NeonBadge>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-risk-high/10 border border-risk-high/30 text-risk-high text-sm">
                    {error}
                </div>
            )}

            {status?.linked ? (
                // Linked State
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-risk-low">
                        <Check className="w-5 h-5" />
                        <span>Your Telegram account is connected</span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Messages sent to the PhishGuard bot will be automatically scanned for phishing.
                    </p>

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={fetchStatus}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>

                        <button
                            onClick={handleUnlink}
                            disabled={isUnlinking}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-risk-high hover:text-risk-high/80 transition-colors"
                        >
                            {isUnlinking ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Unlink className="w-4 h-4" />
                            )}
                            Unlink Account
                        </button>
                    </div>
                </div>
            ) : linkingCode ? (
                // Linking Code State
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Send this command to the PhishGuard Telegram bot:
                    </p>

                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 rounded-lg bg-sidebar-accent border border-sidebar-border font-mono text-lg text-cyan">
                            /link {linkingCode.code}
                        </code>

                        <button
                            onClick={handleCopyCode}
                            className="p-3 rounded-lg border border-sidebar-border hover:bg-sidebar-accent transition-colors"
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-risk-low" />
                            ) : (
                                <Copy className="w-5 h-5 text-muted-foreground" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Code expires in: <span className="text-white font-mono">{formatTimeLeft(timeLeft)}</span>
                        </span>

                        <button
                            onClick={handleGenerateCode}
                            disabled={isGenerating}
                            className="text-cyan hover:text-cyan/80 transition-colors"
                        >
                            Generate new code
                        </button>
                    </div>

                    <div className="pt-2 border-t border-sidebar-border">
                        <p className="text-xs text-muted-foreground">
                            After sending the command, your account will be linked automatically.
                            Return here to verify the connection.
                        </p>
                    </div>
                </div>
            ) : (
                // Not Linked State
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Link your Telegram account to enable automatic phishing detection for messages
                        sent to the PhishGuard bot.
                    </p>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">How it works:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Click "Generate Linking Code" below</li>
                            <li>Open Telegram and find the PhishGuard bot</li>
                            <li>Send the linking command to the bot</li>
                            <li>Your account will be connected automatically</li>
                        </ol>
                    </div>

                    <GlowButton
                        onClick={handleGenerateCode}
                        disabled={isGenerating}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Link2 className="w-4 h-4 mr-2" />
                                Generate Linking Code
                            </>
                        )}
                    </GlowButton>
                </div>
            )}
        </GlassCard>
    )
}
