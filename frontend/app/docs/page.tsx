import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { DocsContent } from "@/components/docs/docs-content"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-navy cyber-grid">
      <Navbar />
      <main className="pt-20">
        <DocsContent />
      </main>
      <Footer />
    </div>
  )
}
