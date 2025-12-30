"use client"

import { useEffect } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { RecentEmailsTable } from "@/components/dashboard/recent-emails-table"
import { PlatformSelector, DASHBOARD_PLATFORMS, type Platform } from "@/components/dashboard/platform-selector"
import { WhatsAppScanner } from "@/components/dashboard/whatsapp-scanner"
import { TelegramLink } from "@/components/dashboard/telegram-link"
import { useDashboardData } from "@/contexts/dashboard-data-context"

export default function DashboardPage() {
  const { data, setPlatform } = useDashboardData()
  const selectedPlatform = data.platform

  // Handle platform change - updates context which triggers data fetch
  const handlePlatformChange = (platform: Platform) => {
    setPlatform(platform)
  }

  const getPlatformSubtitle = () => {
    switch (selectedPlatform) {
      case "email":
        return "Monitor and analyze your email security in real-time"
      case "telegram":
        return "Automatic phishing detection for Telegram messages"
      case "whatsapp":
        return "Manually scan WhatsApp messages for phishing threats"
    }
  }

  return (
    <>
      <DashboardHeader
        title="Phishing Detection Dashboard"
        subtitle={getPlatformSubtitle()}
      />

      {/* Platform Selector */}
      <div className="mb-6">
        <PlatformSelector
          platforms={DASHBOARD_PLATFORMS}
          selected={selectedPlatform}
          onChange={handlePlatformChange}
        />
      </div>

      {/* Email Platform - Original Dashboard */}
      {selectedPlatform === "email" && (
        <>
          <DashboardStats platform="email" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
            <DashboardCharts platform="email" />
          </div>
          <div className="mt-8">
            <RecentEmailsTable />
          </div>
        </>
      )}

      {/* Telegram Platform */}
      {selectedPlatform === "telegram" && (
        <div className="space-y-6">
          {/* Telegram Link Status */}
          <TelegramLink />

          {/* Telegram Stats - same layout as email */}
          <DashboardStats platform="telegram" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
            <DashboardCharts platform="telegram" />
          </div>
        </div>
      )}

      {/* WhatsApp Platform */}
      {selectedPlatform === "whatsapp" && (
        <div className="space-y-6">
          {/* WhatsApp Scanner - Manual Input */}
          <WhatsAppScanner />

          {/* WhatsApp Stats - same layout as email */}
          <DashboardStats platform="whatsapp" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
            <DashboardCharts platform="whatsapp" />
          </div>
        </div>
      )}
    </>
  )
}
