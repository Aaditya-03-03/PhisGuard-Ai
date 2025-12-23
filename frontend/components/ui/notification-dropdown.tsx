"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, AlertTriangle, ShieldAlert, X, Mail, ExternalLink } from "lucide-react"
import { getLatestScan, Email } from "@/lib/api"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
    id: string
    type: "high" | "medium" | "info"
    title: string
    message: string
    time: string
    read: boolean
    emailId?: string
}

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(n => !n.read).length

    // Fetch notifications from scan results
    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const scanResult = await getLatestScan()
            if (scanResult && scanResult.results) {
                // Get high and medium risk emails as notifications
                const highRiskEmails = scanResult.results
                    .filter((email: Email) =>
                        email.riskLevel.toUpperCase() === 'HIGH' ||
                        email.riskLevel.toUpperCase() === 'MEDIUM'
                    )
                    .slice(0, 10) // Limit to 10 most recent
                    .map((email: Email) => ({
                        id: email.id || email.gmailId || Math.random().toString(),
                        type: email.riskLevel.toUpperCase() === 'HIGH' ? 'high' as const : 'medium' as const,
                        title: email.riskLevel.toUpperCase() === 'HIGH'
                            ? '🚨 High Risk Email Detected'
                            : '⚠️ Suspicious Email Found',
                        message: `From: ${email.senderName || email.sender}\n${email.subject}`,
                        time: formatTimeAgo(email.receivedAt),
                        read: false,
                        emailId: email.id || email.gmailId
                    }))

                // Add summary notification if there are high risk emails
                if (scanResult.summary.high > 0) {
                    highRiskEmails.unshift({
                        id: 'summary',
                        type: 'high' as const,
                        title: `🛡️ Phishing Alert`,
                        message: `${scanResult.summary.high} high-risk and ${scanResult.summary.medium} suspicious emails detected in your inbox.`,
                        time: 'Just now',
                        read: false,
                        emailId: undefined
                    })
                }

                setNotifications(highRiskEmails)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    // Format time ago
    function formatTimeAgo(dateString: string): string {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    // Mark all as read
    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    // Clear all notifications
    const clearAll = () => {
        setNotifications([])
    }

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-navy-lighter/50 text-muted-foreground hover:text-white hover:bg-navy-lighter transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-risk-high rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-navy-lighter border border-cyan/20 rounded-xl shadow-2xl shadow-cyan/10 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-cyan/10 bg-navy/50">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-cyan" />
                            Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={markAllRead}
                                        className="text-xs text-cyan hover:text-cyan/80 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="text-xs text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Clear
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Mail className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-sm">No alerts at this time</p>
                                <p className="text-xs mt-1">Your inbox looks safe!</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "px-4 py-3 border-b border-cyan/5 hover:bg-navy/50 transition-colors cursor-pointer",
                                        !notification.read && "bg-cyan/5"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg shrink-0",
                                            notification.type === 'high' && "bg-risk-high/20 text-risk-high",
                                            notification.type === 'medium' && "bg-risk-medium/20 text-risk-medium",
                                            notification.type === 'info' && "bg-cyan/20 text-cyan"
                                        )}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {notification.time}
                                                </span>
                                                {notification.emailId && (
                                                    <Link
                                                        href={`/dashboard/email/${notification.emailId}`}
                                                        className="text-[10px] text-cyan hover:text-cyan/80 flex items-center gap-1"
                                                    >
                                                        View <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 bg-cyan rounded-full shrink-0 mt-2" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-cyan/10 bg-navy/50">
                            <Link
                                href="/dashboard/flagged"
                                className="text-xs text-cyan hover:text-cyan/80 flex items-center justify-center gap-1"
                                onClick={() => setIsOpen(false)}
                            >
                                View all flagged emails <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
