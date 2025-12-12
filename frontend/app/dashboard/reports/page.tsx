import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ReportsContent } from "@/components/dashboard/reports-content"

export default function ReportsPage() {
  return (
    <>
      <DashboardHeader title="Reports" subtitle="Analyze historical data and export security reports" />
      <ReportsContent />
    </>
  )
}
