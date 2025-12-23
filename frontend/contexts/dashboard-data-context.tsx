"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { getLatestScan, getEmailStats, type ScanResult, type EmailStats } from "@/lib/api"

interface DashboardData {
    scanResult: ScanResult | null
    stats: EmailStats
    lastUpdated: Date | null
    isLoading: boolean
    hasNewData: boolean
}

interface DashboardDataContextType {
    data: DashboardData
    refresh: () => Promise<void>
    setAutoRefreshInterval: (ms: number) => void
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
}

export function DashboardDataProvider({
    children,
    initialRefreshInterval = 15000 // Default: 15 seconds
}: DashboardDataProviderProps) {
    const [data, setData] = useState<DashboardData>({
        scanResult: null,
        stats: defaultStats,
        lastUpdated: null,
        isLoading: true,
        hasNewData: false
    })

    const [refreshInterval, setRefreshInterval] = useState(initialRefreshInterval)
    const previousTotalRef = useRef<number>(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const fetchData = useCallback(async () => {
        try {
            // Fetch latest scan results and stats in parallel
            const [scanResult, stats] = await Promise.all([
                getLatestScan(),
                getEmailStats()
            ])

            // Check if there's new data
            const newTotal = stats.total
            const hasNewData = previousTotalRef.current > 0 && newTotal > previousTotalRef.current

            if (hasNewData) {
                console.log(`[Dashboard] New emails detected! Previous: ${previousTotalRef.current}, New: ${newTotal}`)
            }

            previousTotalRef.current = newTotal

            setData({
                scanResult,
                stats,
                lastUpdated: new Date(),
                isLoading: false,
                hasNewData
            })

            // Reset hasNewData after a short delay
            if (hasNewData) {
                setTimeout(() => {
                    setData(prev => ({ ...prev, hasNewData: false }))
                }, 3000)
            }

        } catch (error) {
            console.error("[Dashboard] Failed to fetch dashboard data:", error)
            setData(prev => ({ ...prev, isLoading: false }))
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Set up auto-refresh interval
    useEffect(() => {
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        // Set up new interval
        intervalRef.current = setInterval(fetchData, refreshInterval)
        console.log(`[Dashboard] Auto-refresh set to ${refreshInterval / 1000}s`)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [fetchData, refreshInterval])

    // Listen for visibility changes - refresh when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                console.log("[Dashboard] Tab became visible, refreshing...")
                fetchData()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [fetchData])

    const setAutoRefreshInterval = useCallback((ms: number) => {
        setRefreshInterval(Math.max(5000, ms)) // Minimum 5 seconds
    }, [])

    const value = {
        data,
        refresh: fetchData,
        setAutoRefreshInterval
    }

    return (
        <DashboardDataContext.Provider value={value}>
            {children}
        </DashboardDataContext.Provider>
    )
}
