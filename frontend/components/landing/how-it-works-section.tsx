import { GlassCard } from "@/components/ui/glass-card"
import { Mail, KeyRound, Cpu, Lock, Database, BarChart3 } from "lucide-react"

const steps = [
  {
    icon: Mail,
    title: "Gmail",
    description: "Emails fetched from your inbox",
  },
  {
    icon: KeyRound,
    title: "OAuth 2.0",
    description: "Secure Gmail authentication",
  },
  {
    icon: Cpu,
    title: "AI Engine",
    description: "ML phishing classification",
  },
  {
    icon: Lock,
    title: "Encryption",
    description: "AES-256 data protection",
  },
  {
    icon: Database,
    title: "Firestore",
    description: "Secure cloud storage",
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    description: "Real-time analytics",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-navy-light/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A seamless pipeline from email ingestion to threat analysis
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <GlassCard className="text-center group hover:glow-cyan transition-all duration-300">
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-blue flex items-center justify-center text-sm font-bold text-navy shadow-lg">
                    {index + 1}
                  </div>

                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 transition-colors">
                    <step.icon className="w-8 h-8 text-cyan" />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </GlassCard>

                {/* Arrow connector (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 -translate-y-1/2 z-10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-full h-full text-cyan"
                      style={{ filter: "drop-shadow(0 0 4px rgba(39, 243, 214, 0.5))" }}
                    >
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
