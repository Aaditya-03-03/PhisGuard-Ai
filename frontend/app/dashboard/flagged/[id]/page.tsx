import { DashboardHeader } from "@/components/layout/dashboard-header"
import { EmailAnalysisReport } from "@/components/dashboard/email-analysis-report"

export default async function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <DashboardHeader title="Email Analysis Report" subtitle={`Detailed analysis for email ID: ${id}`} />
      <EmailAnalysisReport emailId={id} />
    </>
  )
}
