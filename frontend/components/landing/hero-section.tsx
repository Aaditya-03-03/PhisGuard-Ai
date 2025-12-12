import Link from "next/link"
import { GlowButton } from "@/components/ui/glow-button"
import { CyberShield } from "@/components/ui/cyber-shield"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ArrowRight, Shield, Zap, Lock } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue/10 rounded-full blur-3xl" />

        {/* Animated scan line */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan to-transparent animate-scan-line" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Badge */}
        <NeonBadge variant="cyan" className="mb-8">
          AI-Powered Security
        </NeonBadge>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="block">AI-Powered Automated</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan to-blue">
            Phishing Detection
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
          Automatically fetch Gmail emails, detect phishing using AI/ML, encrypt sensitive data with AES-256, and
          monitor results in a real-time cloud dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/signup">
            <GlowButton variant="primary" size="lg">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </GlowButton>
          </Link>
        </div>

        {/* Hero visual */}
        <div className="relative max-w-4xl mx-auto">
          {/* Central shield */}
          <div className="flex justify-center mb-8">
            <CyberShield size="xl" animated />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
              <Shield className="w-4 h-4 text-cyan" />
              <span className="text-sm text-white">Real-time Protection</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
              <Zap className="w-4 h-4 text-cyan" />
              <span className="text-sm text-white">ML-Powered Analysis</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
              <Lock className="w-4 h-4 text-cyan" />
              <span className="text-sm text-white">AES-256 Encryption</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
          {[
            { value: "99.7%", label: "Detection Accuracy" },
            { value: "<100ms", label: "Analysis Time" },
            { value: "256-bit", label: "Encryption" },
            { value: "24/7", label: "Monitoring" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-cyan glow-text-cyan mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
