"use client"

/**
 * ESP32 Device Status Component
 * Displays device connection status and pairing interface
 * 
 * PhisGuard-AI - IoT Integration Layer
 */

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { AlertBox } from "@/components/ui/alert-box"
import { Cpu, Wifi, WifiOff, RefreshCw, Copy, Check } from "lucide-react"
import { getDeviceStatus, generatePairingToken, DeviceStatus } from "@/lib/api"

export function DeviceStatusCard() {
    const [status, setStatus] = useState<DeviceStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [pairingToken, setPairingToken] = useState<string | null>(null)
    const [tokenExpiry, setTokenExpiry] = useState<string | null>(null)
    const [generatingToken, setGeneratingToken] = useState(false)
    const [copied, setCopied] = useState(false)

    // Fetch device status on mount and periodically
    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchStatus = async () => {
        try {
            const deviceStatus = await getDeviceStatus()
            setStatus(deviceStatus)
        } catch (error) {
            console.error('Failed to fetch device status:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateToken = async () => {
        setGeneratingToken(true)
        try {
            const result = await generatePairingToken()
            if (result) {
                setPairingToken(result.token)
                setTokenExpiry(result.expiresAt)
            }
        } catch (error) {
            console.error('Failed to generate pairing token:', error)
        } finally {
            setGeneratingToken(false)
        }
    }

    const handleCopyToken = async () => {
        if (pairingToken) {
            await navigator.clipboard.writeText(pairingToken)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const getStatusColor = () => {
        if (!status?.connected) return "text-muted-foreground"
        return status.status === 'online' ? "text-risk-low" : "text-risk-medium"
    }

    const getStatusIcon = () => {
        if (!status?.connected) return <WifiOff className="w-5 h-5" />
        return status.status === 'online'
            ? <Wifi className="w-5 h-5 text-risk-low" />
            : <WifiOff className="w-5 h-5 text-risk-medium" />
    }

    const formatLastSeen = (lastSeen: string | null) => {
        if (!lastSeen) return 'Never'
        const date = new Date(lastSeen)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`
        return date.toLocaleTimeString()
    }

    return (
        <GlassCard variant="strong">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-500/20">
                    <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">ESP32 Device</h2>
            </div>

            <div className="space-y-4">
                {/* Status Display */}
                <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getStatusIcon()}
                            <div>
                                <h3 className="text-white font-medium">
                                    {loading ? 'Checking...' : status?.deviceName || 'No Device'}
                                </h3>
                                <p className={`text-sm ${getStatusColor()}`}>
                                    {loading ? 'Connecting...' :
                                        status?.connected
                                            ? `${status.status === 'online' ? 'Online' : 'Offline'} • Last seen: ${formatLastSeen(status.lastSeen)}`
                                            : 'Not registered'}
                                </p>
                            </div>
                        </div>
                        <GlowButton variant="ghost" size="sm" onClick={fetchStatus} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </GlowButton>
                    </div>

                    {/* Online indicator dot */}
                    {status?.connected && status.status === 'online' && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-risk-low">
                            <div className="w-2 h-2 bg-risk-low rounded-full animate-pulse" />
                            <span>Device is active and responding</span>
                        </div>
                    )}
                </div>

                {/* Pairing Section */}
                {(!status?.connected || status.status === 'not_registered') && (
                    <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
                        <h3 className="text-white font-medium mb-2">Pair New Device</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Generate a pairing token to connect your ESP32 device.
                        </p>

                        {pairingToken ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-navy-lighter rounded-lg font-mono text-xs text-cyan overflow-x-auto">
                                        {pairingToken.substring(0, 32)}...
                                    </code>
                                    <GlowButton variant="secondary" size="sm" onClick={handleCopyToken}>
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </GlowButton>
                                </div>
                                <AlertBox variant="warning">
                                    Token expires in 5 minutes. Enter it on your ESP32 device now.
                                </AlertBox>
                            </div>
                        ) : (
                            <GlowButton
                                variant="primary"
                                onClick={handleGenerateToken}
                                disabled={generatingToken}
                            >
                                {generatingToken ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Cpu className="w-4 h-4" />
                                )}
                                {generatingToken ? 'Generating...' : 'Generate Pairing Token'}
                            </GlowButton>
                        )}
                    </div>
                )}
            </div>
        </GlassCard>
    )
}
