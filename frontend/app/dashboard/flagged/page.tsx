"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { FlaggedEmailsList } from "@/components/dashboard/flagged-emails-list"
import { PlatformSelectorCompact, FLAGGED_PLATFORMS, type Platform } from "@/components/dashboard/platform-selector"

export default function FlaggedMessagesPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("email")

  const getTitle = () => {
    return selectedPlatform === "email" ? "Flagged Emails" : "Flagged Telegram Messages"
  }

  const getSubtitle = () => {
    return selectedPlatform === "email"
      ? "Review and manage detected email phishing threats"
      : "Review flagged messages from Telegram scanning"
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <DashboardHeader title={getTitle()} subtitle={getSubtitle()} />
        <PlatformSelectorCompact
          platforms={FLAGGED_PLATFORMS}
          selected={selectedPlatform}
          onChange={setSelectedPlatform}
        />
      </div>

      {/* Note: WhatsApp does NOT appear here per design spec */}
      <FlaggedEmailsList platform={selectedPlatform} />
    </>
  )
}
