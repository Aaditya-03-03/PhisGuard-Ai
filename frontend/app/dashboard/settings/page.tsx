import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsContent } from "@/components/dashboard/settings-content"

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader title="Settings" subtitle="Configure your phishing detection system" />
      <SettingsContent />
    </>
  )
}
