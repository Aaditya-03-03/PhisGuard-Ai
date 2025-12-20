"use client"

import { useState } from "react"
import { GlowButton } from "@/components/ui/glow-button"
import { GlassCard } from "@/components/ui/glass-card"
import { AlertBox } from "@/components/ui/alert-box"
import { Scan, Mail, AlertTriangle, CheckCircle, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { scanInbox, checkGmailStatus, type ScanResult } from "@/lib/api"

interface ScanInboxButtonProps {
    onScanComplete?: (result: ScanResult) => void
}

export function ScanInboxButton({ onScanComplete }: ScanInboxButtonProps) {
    const { user } = useAuth()
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleScan = async () => {
        if (!user) {
            setError('Please sign in to scan your inbox')
            return
        }

        setIsScanning(true)
        setError(null)
        setScanResult(null)

        try {
            // First check if Gmail is connected
            const status = await checkGmailStatus()
            if (!status.connected) {
                setError('Gmail not connected. Please connect your Gmail account first.')
                window.location.href = '/connect-gmail'
                return
            }

            // Perform the scan
            const result = await scanInbox(100)
            if (result) {
                setScanResult(result)
                onScanComplete?.(result)
            }
        } catch (err) {
            console.error('Scan failed:', err)
            setError(err instanceof Error ? err.message : 'Failed to scan inbox')
        } finally {
            setIsScanning(false)
        }
    }

    return (
        <GlassCard variant="default" className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/20 to-blue/20 flex items-center justify-center border border-cyan/30">
                        <Scan className="w-6 h-6 text-cyan" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Scan Inbox</h3>
                        <p className="text-sm text-muted-foreground">Analyze your emails for phishing threats</p>
                    </div>
                </div>

                <GlowButton
                    variant="primary"
                    onClick={handleScan}
                    disabled={isScanning}
                >
                    {isScanning ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
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
                            Scanning...
                        </span>
                    ) : (
                        <>
                            <Scan className="w-4 h-4" />
                            Scan Now
                        </>
                    )}
                </GlowButton>
            </div>

            {/* Error Message */}
            {error && (
                <AlertBox variant="error" title="Scan Failed">
                    {error}
                </AlertBox>
            )}

            {/* Scan Results Summary */}
            {scanResult && (
                <div className="mt-4 p-4 rounded-xl bg-navy-lighter/50 border border-cyan/10">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-risk-low" />
                        <span className="font-medium text-white">Scan Complete</span>
                        <span className="text-sm text-muted-foreground">({scanResult.scannedCount} emails)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-lg bg-risk-high/10 border border-risk-high/20">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <AlertTriangle className="w-4 h-4 text-risk-high" />
                                <span className="text-lg font-bold text-risk-high">{scanResult.summary.high}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">High Risk</span>
                        </div>

                        <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Shield className="w-4 h-4 text-yellow-500" />
                                <span className="text-lg font-bold text-yellow-500">{scanResult.summary.medium}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Medium Risk</span>
                        </div>

                        <div className="text-center p-3 rounded-lg bg-risk-low/10 border border-risk-low/20">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Mail className="w-4 h-4 text-risk-low" />
                                <span className="text-lg font-bold text-risk-low">{scanResult.summary.low}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Low Risk</span>
                        </div>
                    </div>
                </div>
            )}
        </GlassCard>
    )
}
