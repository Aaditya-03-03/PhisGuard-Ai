"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ReportsContent } from "@/components/dashboard/reports-content"
import { PlatformSelectorCompact, REPORTS_PLATFORMS, type Platform } from "@/components/dashboard/platform-selector"

export default function ReportsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("email")

  const getTitle = () => {
    return selectedPlatform === "email" ? "Email Reports" : "Telegram Reports"
  }

  const getSubtitle = () => {
    return selectedPlatform === "email"
      ? "Analyze historical email data and export security reports"
      : "View Telegram scanning analytics and generate reports"
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <DashboardHeader title={getTitle()} subtitle={getSubtitle()} />
        <PlatformSelectorCompact
          platforms={REPORTS_PLATFORMS}
          selected={selectedPlatform}
          onChange={setSelectedPlatform}
        />
      </div>

      {/* Note: WhatsApp does NOT appear here per design spec */}
      <ReportsContent platform={selectedPlatform} />
    </>
  )
}
