import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { StatusContent } from "@/components/status/status-content"

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-navy cyber-grid">
      <Navbar />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <StatusContent />
      </main>
      <Footer />
    </div>
  )
}
