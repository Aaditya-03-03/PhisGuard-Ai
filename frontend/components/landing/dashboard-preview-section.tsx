import { GlassCard } from "@/components/ui/glass-card"
import { NeonBadge } from "@/components/ui/neon-badge"
import { ProbabilityBar } from "@/components/ui/probability-bar"
import { StatCard } from "@/components/ui/stat-card"
import { SectionDivider } from "@/components/ui/section-divider"
import { Mail, AlertTriangle, ShieldAlert, Activity } from "lucide-react"

const mockEmails = [
  { sender: "security@bankofamerica.com", subject: "Urgent: Verify your account", risk: 89 },
  { sender: "support@amazon.com", subject: "Your order has been shipped", risk: 12 },
  { sender: "admin@paypa1.com", subject: "Action Required: Confirm payment", risk: 95 },
]

export function DashboardPreviewSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-navy-light/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Dashboard Preview</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A powerful interface to monitor and analyze your email security
          </p>
        </div>

        {/* Dashboard mock */}
        <GlassCard variant="strong" className="p-6 sm:p-8">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Scanned"
              value="12,847"
              icon={Mail}
              variant="cyan"
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Phishing Detected"
              value="234"
              icon={AlertTriangle}
              variant="danger"
              trend={{ value: 8, isPositive: false }}
            />
            <StatCard title="Suspicious" value="89" icon={ShieldAlert} variant="warning" />
            <StatCard title="Scan Rate" value="99.9%" icon={Activity} variant="success" />
          </div>

          {/* Recent emails */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Recent Email Analysis
              <NeonBadge variant="cyan" pulse>
                LIVE
              </NeonBadge>
            </h3>

            <div className="space-y-3">
              {mockEmails.map((email, index) => (
                <GlassCard key={index} variant="subtle" className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{email.sender}</p>
                    <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 hidden sm:block">
                      <ProbabilityBar value={email.risk} size="sm" showPercentage={false} />
                    </div>
                    <NeonBadge variant={email.risk >= 70 ? "high" : email.risk >= 40 ? "medium" : "low"}>
                      {email.risk >= 70 ? "HIGH" : email.risk >= 40 ? "MEDIUM" : "LOW"}
                    </NeonBadge>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <SectionDivider variant="glow" className="max-w-4xl mx-auto mt-16" />
    </section>
  )
}
