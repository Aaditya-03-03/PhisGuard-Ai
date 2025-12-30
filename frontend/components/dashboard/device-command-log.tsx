"use client"

/**
 * ESP32 Device Command Log Component
 * Read-only display of recent voice commands from ESP32 device
 * 
 * PhisGuard-AI - IoT Integration Layer
 */

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { Terminal, RefreshCw, Check, X, Mail, Trash2, User } from "lucide-react"
import { getDeviceCommandLog, DeviceCommand } from "@/lib/api"

const COMMAND_ICONS: Record<string, React.ReactNode> = {
    'READ_MAIL': <Mail className="w-4 h-4" />,
    'DELETE_MAIL': <Trash2 className="w-4 h-4" />,
    'SENDER_INFO': <User className="w-4 h-4" />
}

const COMMAND_LABELS: Record<string, string> = {
    'READ_MAIL': 'Read Mail',
    'DELETE_MAIL': 'Delete Mail',
    'SENDER_INFO': 'Sender Info'
}

export function DeviceCommandLog() {
    const [logs, setLogs] = useState<DeviceCommand[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
        const interval = setInterval(fetchLogs, 60000) // Refresh every minute
        return () => clearInterval(interval)
    }, [])

    const fetchLogs = async () => {
        try {
            const commandLogs = await getDeviceCommandLog(10)
            setLogs(commandLogs)
        } catch (error) {
            console.error('Failed to fetch command logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <GlassCard variant="strong">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan/20">
                        <Terminal className="w-5 h-5 text-cyan" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Voice Commands</h2>
                </div>
                <GlowButton variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </GlowButton>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {loading ? 'Loading...' : 'No voice commands yet'}
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className="flex items-center gap-3 p-3 bg-navy-lighter/50 rounded-lg border border-cyan/5"
                        >
                            {/* Command Icon */}
                            <div className={`p-2 rounded-lg ${log.success ? 'bg-risk-low/20 text-risk-low' : 'bg-risk-high/20 text-risk-high'
                                }`}>
                                {COMMAND_ICONS[log.command] || <Terminal className="w-4 h-4" />}
                            </div>

                            {/* Command Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">
                                        {COMMAND_LABELS[log.command] || log.command}
                                    </span>
                                    {log.success ? (
                                        <Check className="w-3 h-3 text-risk-low" />
                                    ) : (
                                        <X className="w-3 h-3 text-risk-high" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {log.response}
                                </p>
                            </div>

                            {/* Timestamp */}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimestamp(log.timestamp)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    )
}
