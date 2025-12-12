import { DashboardHeader } from "@/components/layout/dashboard-header"
import { FlaggedEmailsList } from "@/components/dashboard/flagged-emails-list"

export default function FlaggedEmailsPage() {
  return (
    <>
      <DashboardHeader title="Flagged Emails" subtitle="Review and manage detected phishing threats" />
      <FlaggedEmailsList />
    </>
  )
}
