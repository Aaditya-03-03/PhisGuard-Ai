import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { RecentEmailsTable } from "@/components/dashboard/recent-emails-table"
import { ScanInboxButton } from "@/components/dashboard/scan-inbox-button"

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader title="Phishing Detection Dashboard" subtitle="Monitor and analyze your email security" />

      {/* Scan Button */}
      <div className="mb-6">
        <ScanInboxButton />
      </div>

      <DashboardStats />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <DashboardCharts />
      </div>
      <div className="mt-8">
        <RecentEmailsTable />
      </div>
    </>
  )
}

