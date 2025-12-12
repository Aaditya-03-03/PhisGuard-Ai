import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { ArchitectureSection } from "@/components/landing/architecture-section"
import { DashboardPreviewSection } from "@/components/landing/dashboard-preview-section"
import { BenefitsSection } from "@/components/landing/benefits-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy cyber-grid">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ArchitectureSection />
        <DashboardPreviewSection />
        <BenefitsSection />
      </main>
      <Footer />
    </div>
  )
}
