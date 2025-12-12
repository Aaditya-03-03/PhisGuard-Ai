import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { CheckCircle, ArrowRight } from "lucide-react"

const benefits = [
  "End-to-End Automated Pipeline",
  "AI-Enhanced Security Detection",
  "Cloud-Native & Infinitely Scalable",
  "Military-Grade AES-256 Encryption",
  "Free to Deploy on Cloud Platforms",
  "Real-Time Threat Monitoring",
  "Open Source & Customizable",
  "No Vendor Lock-In",
]

export function BenefitsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Benefits list */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Why Choose{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-blue">PhishGuard AI</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Built for modern security needs with cutting-edge technology and enterprise-grade reliability.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan flex-shrink-0" />
                  <span className="text-white">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <GlassCard variant="strong" className="p-8 text-center glow-cyan">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Secure Your Inbox?</h3>
            <p className="text-muted-foreground mb-8">
              Get started in minutes with our easy setup process. Connect your Gmail and let AI protect you from
              phishing threats.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/connect-gmail">
                <GlowButton variant="primary" size="lg">
                  Connect Gmail
                  <ArrowRight className="w-5 h-5" />
                </GlowButton>
              </Link>
              <Link href="/docs">
                <GlowButton variant="secondary" size="lg">
                  Read Documentation
                </GlowButton>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 pt-6 border-t border-cyan/20 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span>No credit card required</span>
              <span>•</span>
              <span>5 minute setup</span>
              <span>•</span>
              <span>Free forever tier</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
