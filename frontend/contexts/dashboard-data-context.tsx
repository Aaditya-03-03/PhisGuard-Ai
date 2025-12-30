"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import {
    getLatestScan,
    getEmailStats,
    getResultsByPlatform,
    getStatsByPlatform,
    type ScanResult,
    type EmailStats,
    type Platform,
    type PhishingResult
} from "@/lib/api"

interface DashboardData {
    scanResult: ScanResult | null
    stats: EmailStats
    lastUpdated: Date | null
    isLoading: boolean
    hasNewData: boolean
    platform: Platform
}

interface DashboardDataContextType {
    data: DashboardData
    refresh: () => Promise<void>
    setAutoRefreshInterval: (ms: number) => void
    setPlatform: (platform: Platform) => void
}

const defaultStats: EmailStats = {
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
}

const DashboardDataContext = createContext<DashboardDataContextType | null>(null)

export function useDashboardData() {
    const context = useContext(DashboardDataContext)
    if (!context) {
        throw new Error("useDashboardData must be used within a DashboardDataProvider")
    }
    return context
}

interface DashboardDataProviderProps {
    children: React.ReactNode
    initialRefreshInterval?: number // in milliseconds
    initialPlatform?: Platform
}

export function DashboardDataProvider({
    children,
    initialRefreshInterval = 15000, // Default: 15 seconds
    initialPlatform = "email"
}: DashboardDataProviderProps) {
    const [platform, setPlatformState] = useState<Platform>(initialPlatform)
    const [data, setData] = useState<DashboardData>({
        scanResult: null,
        stats: defaultStats,
        lastUpdated: null,
        isLoading: true,
        hasNewData: false,
        platform: initialPlatform
    })

    const [refreshInterval, setRefreshInterval] = useState(initialRefreshInterval)
    const previousTotalRef = useRef<number>(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const fetchData = useCallback(async (targetPlatform: Platform) => {
        setData(prev => ({ ...prev, isLoading: true }))

        try {
            let scanResult: ScanResult | null = null
            let stats: EmailStats = defaultStats

            if (targetPlatform === "email") {
                // Email uses existing endpoints
                const [emailScan, emailStats] = await Promise.all([
                    getLatestScan(),
                    getEmailStats()
                ])
                scanResult = emailScan
                stats = emailStats
            } else {
                // Telegram and WhatsApp use platform-specific endpoints
                const [results, platformStats] = await Promise.all([
                    getResultsByPlatform(targetPlatform, 100),
                    getStatsByPlatform(targetPlatform)
                ])

                // Convert platform results to ScanResult format for charts
                scanResult = convertResultsToScanResult(results)
                stats = platformStats
            }

            // Check if there's new data
            const newTotal = stats.total
            const hasNewData = previousTotalRef.current > 0 && newTotal > previousTotalRef.current

            if (hasNewData) {
                console.log(`[Dashboard] New ${targetPlatform} data! Previous: ${previousTotalRef.current}, New: ${newTotal}`)
            }

            previousTotalRef.current = newTotal

            setData({
                scanResult,
                stats,
                lastUpdated: new Date(),
                isLoading: false,
                hasNewData,
                platform: targetPlatform
            })

            // Reset hasNewData after a short delay
            if (hasNewData) {
                setTimeout(() => {
                    setData(prev => ({ ...prev, hasNewData: false }))
                }, 3000)
            }

        } catch (error) {
            console.error(`[Dashboard] Failed to fetch ${targetPlatform} data:`, error)
            setData(prev => ({ ...prev, isLoading: false }))
        }
    }, [])

    // Helper function to convert PhishingResult[] to ScanResult format
    function convertResultsToScanResult(results: PhishingResult[]): ScanResult {
        const summary = {
            high: results.filter(r => r.risk === "HIGH").length,
            medium: results.filter(r => r.risk === "MEDIUM").length,
            low: results.filter(r => r.risk === "LOW").length,
            total: results.length
        }

        // Convert to email-like format for chart compatibility
        const emailResults = results.map(r => ({
            id: r.id,
            gmailId: r.id,
            messageId: r.id,
            sender: `${r.platform}@phishguard`,
            senderName: r.platform.charAt(0).toUpperCase() + r.platform.slice(1),
            subject: r.content.substring(0, 100) + (r.content.length > 100 ? "..." : ""),
            body: r.content,
            receivedAt: r.createdAt,
            processedAt: r.createdAt,
            riskLevel: r.risk,
            phishingScore: r.confidence,
            flags: r.reasons,
            urlCount: 0,
            urls: []
        }))

        return {
            scannedCount: results.length,
            scannedAt: new Date().toISOString(),
            results: emailResults,
            summary
        }
    }

    // Fetch when platform changes
    useEffect(() => {
        previousTotalRef.current = 0 // Reset when platform changes
        fetchData(platform)
    }, [platform, fetchData])

    // Set up auto-refresh interval
    useEffect(() => {
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        // Set up new interval
        intervalRef.current = setInterval(() => fetchData(platform), refreshInterval)
        console.log(`[Dashboard] Auto-refresh set to ${refreshInterval / 1000}s for ${platform}`)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [fetchData, refreshInterval, platform])

    // Listen for visibility changes - refresh when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                console.log("[Dashboard] Tab became visible, refreshing...")
                fetchData(platform)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [fetchData, platform])

    const setAutoRefreshInterval = useCallback((ms: number) => {
        setRefreshInterval(Math.max(5000, ms)) // Minimum 5 seconds
    }, [])

    const setPlatform = useCallback((newPlatform: Platform) => {
        if (newPlatform !== platform) {
            setPlatformState(newPlatform)
        }
    }, [platform])

    const value = {
        data,
        refresh: () => fetchData(platform),
        setAutoRefreshInterval,
        setPlatform
    }

    return (
        <DashboardDataContext.Provider value={value}>
            {children}
        </DashboardDataContext.Provider>
    )
}
