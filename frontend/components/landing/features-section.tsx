import { GlassCard } from "@/components/ui/glass-card"
import { SectionDivider } from "@/components/ui/section-divider"
import { Mail, Brain, Lock, Link2, Cloud, Bell } from "lucide-react"

const features = [
  {
    icon: Mail,
    title: "Gmail Auto-Fetch",
    description: "Automatically connect and scan your Gmail inbox using n8n workflows for seamless email monitoring.",
    color: "cyan",
  },
  {
    icon: Brain,
    title: "AI/NLP Phishing Detection",
    description:
      "Advanced DistilBERT-based ML model analyzes email content, subject lines, and patterns to identify threats.",
    color: "blue",
  },
  {
    icon: Lock,
    title: "AES-256 Encryption",
    description: "All sensitive data including URLs and email content is encrypted with military-grade AES-256.",
    color: "cyan",
  },
  {
    icon: Link2,
    title: "URL Extraction & Risk Scoring",
    description: "Automatically extract and analyze all URLs with comprehensive risk assessment and threat scoring.",
    color: "blue",
  },
  {
    icon: Cloud,
    title: "Cloud Dashboard",
    description: "Real-time Firebase-powered dashboard deployed on Vercel for instant access anywhere.",
    color: "cyan",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description: "Instant notifications when phishing emails are detected with detailed threat insights.",
    color: "blue",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Powerful Security Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive protection powered by cutting-edge AI and encryption technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <GlassCard key={feature.title} hover className="group">
              <div
                className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center transition-all duration-300
                  ${feature.color === "cyan" ? "bg-cyan/20 text-cyan group-hover:shadow-[0_0_20px_rgba(39,243,214,0.4)]" : "bg-blue/20 text-blue group-hover:shadow-[0_0_20px_rgba(58,134,255,0.4)]"}`}
              >
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <SectionDivider variant="glow" className="max-w-4xl mx-auto" />
    </section>
  )
}
