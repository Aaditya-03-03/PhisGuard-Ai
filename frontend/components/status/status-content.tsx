"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { CyberShield } from "@/components/ui/cyber-shield"
import { RefreshCw, Mail, Server, Brain, Lock, Clock } from "lucide-react"

const services = [
  {
    name: "Gmail Connection",
    description: "OAuth connection to Gmail API",
    status: "online" as const,
    icon: Mail,
    latency: "45ms",
  },
  {
    name: "Backend API",
    description: "Core API server and endpoints",
    status: "online" as const,
    icon: Server,
    latency: "23ms",
  },
  {
    name: "AI Model",
    description: "DistilBERT phishing classifier",
    status: "online" as const,
    icon: Brain,
    latency: "78ms",
  },
  {
    name: "Encryption System",
    description: "AES-256-GCM encryption service",
    status: "online" as const,
    icon: Lock,
    latency: "12ms",
  },
]

export function StatusContent() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }

  const allOperational = services.every((s) => s.status === "online")

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <CyberShield size="xl" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">System Status</h1>
        <p className="text-muted-foreground">Real-time status of PhishGuard AI services</p>
      </div>

      {/* Overall status */}
      <GlassCard variant="strong" glow={allOperational ? "cyan" : undefined} className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <StatusIndicator status={allOperational ? "online" : "warning"} size="lg" />
          <h2 className="text-2xl font-bold text-white">
            {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
          </h2>
        </div>
        <p className="text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()} ({lastUpdated.toLocaleDateString()})
        </p>
      </GlassCard>

      {/* Services grid */}
      <div className="space-y-4">
        {services.map((service) => (
          <GlassCard
            key={service.name}
            className="p-5 flex items-center justify-between hover:border-cyan/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${
                  service.status === "online" ? "bg-cyan/20 text-cyan" : "bg-risk-medium/20 text-risk-medium"
                }`}
              >
                <service.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{service.latency}</span>
                </div>
              </div>
              <StatusIndicator
                status={service.status}
                label={service.status === "online" ? "Operational" : "Degraded"}
              />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Refresh button */}
      <div className="flex justify-center">
        <GlowButton variant="secondary" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Status"}
        </GlowButton>
      </div>

      {/* Incident history */}
      <GlassCard variant="strong">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents</h3>
        <div className="space-y-4">
          <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-risk-low font-medium">Resolved</span>
              <span className="text-xs text-muted-foreground">Jan 10, 2024</span>
            </div>
            <p className="text-sm text-white mb-1">API latency spike</p>
            <p className="text-xs text-muted-foreground">
              Brief increase in API response times due to high traffic. Resolved within 15 minutes.
            </p>
          </div>

          <div className="text-center py-4 text-muted-foreground text-sm">No other incidents in the past 90 days</div>
        </div>
      </GlassCard>
    </div>
  )
}
