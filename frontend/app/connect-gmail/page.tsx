import { SimpleHeader } from "@/components/layout/simple-header"
import { Footer } from "@/components/layout/footer"
import { GmailConnectionCard } from "@/components/gmail/gmail-connection-card"

export default function ConnectGmailPage() {
  return (
    <div className="min-h-screen bg-navy cyber-grid">
      <SimpleHeader />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <GmailConnectionCard />
        </div>
      </main>
      <Footer />
    </div>
  )
}
