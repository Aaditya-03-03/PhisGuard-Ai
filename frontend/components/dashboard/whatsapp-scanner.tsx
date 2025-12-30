"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { NeonBadge } from "@/components/ui/neon-badge"
import { MessageCircle, AlertTriangle, CheckCircle, Loader2, Trash2 } from "lucide-react"
import { scanWhatsAppMessage } from "@/lib/api"

// ============================================
// TYPES
// ============================================

interface ScanResult {
    id?: string
    risk: "LOW" | "MEDIUM" | "HIGH"
    confidence: number
    reasons: string[]
    flags: string[]
    scannedAt: Date
}

// ============================================
// COMPONENT
// ============================================

export function WhatsAppScanner() {
    const [message, setMessage] = useState("")
    const [isScanning, setIsScanning] = useState(false)
    const [result, setResult] = useState<ScanResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [scanHistory, setScanHistory] = useState<ScanResult[]>([])

    const handleScan = async () => {
        if (!message.trim()) {
            setError("Please paste a message to scan")
            return
        }

        setIsScanning(true)
        setError(null)
        setResult(null)

        try {
            const response = await scanWhatsAppMessage(message.trim())

            const scanResult: ScanResult = {
                id: response.id,
                risk: response.risk,
                confidence: response.confidence,
                reasons: response.reasons || [],
                flags: response.flags || [],
                scannedAt: new Date()
            }

            setResult(scanResult)
            setScanHistory(prev => [scanResult, ...prev].slice(0, 5)) // Keep last 5
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to scan message")
        } finally {
            setIsScanning(false)
        }
    }

    const handleClear = () => {
        setMessage("")
        setResult(null)
        setError(null)
    }

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case "HIGH": return "text-risk-high"
            case "MEDIUM": return "text-risk-medium"
            case "LOW": return "text-risk-low"
            default: return "text-muted-foreground"
        }
    }

    const getRiskVariant = (risk: string): "high" | "medium" | "low" => {
        switch (risk) {
            case "HIGH": return "high"
            case "MEDIUM": return "medium"
            case "LOW": return "low"
            default: return "low"
        }
    }

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">WhatsApp Message Scanner</h3>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                    Paste a WhatsApp message below to scan it for phishing indicators.
                </p>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Paste your WhatsApp message here..."
                    className="w-full h-40 p-4 rounded-lg bg-sidebar-accent/50 border border-sidebar-border text-white placeholder-muted-foreground resize-none focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20"
                    maxLength={10000}
                />

                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">
                        {message.length}/10,000 characters
                    </span>

                    <div className="flex gap-2">
                        {message && (
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear
                            </button>
                        )}

                        <GlowButton
                            onClick={handleScan}
                            disabled={isScanning || !message.trim()}
                            className="px-6"
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                "Scan Message"
                            )}
                        </GlowButton>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-risk-high/10 border border-risk-high/30 text-risk-high text-sm">
                        {error}
                    </div>
                )}
            </GlassCard>

            {/* Result Section */}
            {result && (
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Scan Result</h3>
                        <NeonBadge variant={getRiskVariant(result.risk)}>
                            {result.risk} RISK
                        </NeonBadge>
                    </div>

                    <div className="space-y-4">
                        {/* Risk Score */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Phishing Probability</span>
                                <span className={getRiskColor(result.risk)}>
                                    {Math.round(result.confidence * 100)}%
                                </span>
                            </div>
                            <ProbabilityBar
                                value={result.confidence}
                                showPercentage={false}
                                size="md"
                            />
                        </div>

                        {/* Risk Reasons */}
                        {result.reasons.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-white mb-2">Warning Signs</h4>
                                <ul className="space-y-1.5">
                                    {result.reasons.map((reason, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <AlertTriangle className="w-4 h-4 text-risk-medium mt-0.5 flex-shrink-0" />
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Safe Message */}
                        {result.risk === "LOW" && result.reasons.length === 0 && (
                            <div className="flex items-center gap-2 text-risk-low">
                                <CheckCircle className="w-5 h-5" />
                                <span>No phishing indicators detected</span>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* Recent Scans (session only) */}
            {scanHistory.length > 1 && (
                <GlassCard className="p-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Scans (this session)</h3>
                    <div className="space-y-2">
                        {scanHistory.slice(1).map((scan, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-sidebar-accent/30"
                            >
                                <span className="text-sm text-muted-foreground">
                                    {scan.scannedAt.toLocaleTimeString()}
                                </span>
                                <NeonBadge variant={getRiskVariant(scan.risk)} className="text-xs">
                                    {scan.risk}
                                </NeonBadge>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}
        </div>
    )
}
