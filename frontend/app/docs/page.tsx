import { SimpleHeader } from "@/components/layout/simple-header"
import { Footer } from "@/components/layout/footer"
import { DocsContent } from "@/components/docs/docs-content"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-navy cyber-grid">
      <SimpleHeader />
      <main className="pt-20">
        <DocsContent />
      </main>
      <Footer />
    </div>
  )
}
