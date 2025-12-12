"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { Calendar, Download, FileText, FileSpreadsheet } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

const weeklyData = [
  { week: "Week 1", high: 45, medium: 23, low: 12 },
  { week: "Week 2", high: 52, medium: 31, low: 18 },
  { week: "Week 3", high: 38, medium: 25, low: 15 },
  { week: "Week 4", high: 61, medium: 42, low: 22 },
]

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  count: Math.floor(Math.random() * 50) + 5,
}))

const historicalLogs = [
  { id: "1", date: "2024-01-15", total: 456, phishing: 34, status: "Processed" },
  { id: "2", date: "2024-01-14", total: 523, phishing: 41, status: "Processed" },
  { id: "3", date: "2024-01-13", total: 389, phishing: 28, status: "Processed" },
  { id: "4", date: "2024-01-12", total: 467, phishing: 35, status: "Processed" },
  { id: "5", date: "2024-01-11", total: 512, phishing: 39, status: "Processed" },
]

export function ReportsContent() {
  const [dateRange, setDateRange] = useState({ start: "2024-01-01", end: "2024-01-15" })

  return (
    <div className="space-y-6">
      {/* Date range and export */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Date range picker */}
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-cyan" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2 bg-navy-lighter/50 border border-cyan/20 rounded-xl text-white text-sm focus:outline-none focus:border-cyan/50"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2 bg-navy-lighter/50 border border-cyan/20 rounded-xl text-white text-sm focus:outline-none focus:border-cyan/50"
              />
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <GlowButton variant="secondary" size="sm">
              <FileText className="w-4 h-4" />
              Export PDF
            </GlowButton>
            <GlowButton variant="secondary" size="sm">
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly bar chart */}
        <GlassCard variant="strong">
          <h3 className="text-lg font-semibold text-white mb-6">Weekly Phishing Email Counts</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(39, 243, 214, 0.1)" />
                <XAxis dataKey="week" stroke="rgba(234, 246, 255, 0.5)" fontSize={12} />
                <YAxis stroke="rgba(234, 246, 255, 0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(16, 24, 40, 0.9)",
                    border: "1px solid rgba(39, 243, 214, 0.3)",
                    borderRadius: "12px",
                    color: "#EAF6FF",
                  }}
                />
                <Bar dataKey="high" stackId="a" fill="#ff4757" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill="#ffa502" radius={[0, 0, 0, 0]} />
                <Bar dataKey="low" stackId="a" fill="#2ed573" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-risk-high" />
              <span className="text-muted-foreground">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-risk-medium" />
              <span className="text-muted-foreground">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-risk-low" />
              <span className="text-muted-foreground">Low Risk</span>
            </div>
          </div>
        </GlassCard>

        {/* Hourly activity heatmap-style chart */}
        <GlassCard variant="strong">
          <h3 className="text-lg font-semibold text-white mb-6">Phishing Activity by Hour</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27F3D6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#27F3D6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(39, 243, 214, 0.1)" />
                <XAxis dataKey="hour" stroke="rgba(234, 246, 255, 0.5)" fontSize={10} interval={3} />
                <YAxis stroke="rgba(234, 246, 255, 0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(16, 24, 40, 0.9)",
                    border: "1px solid rgba(39, 243, 214, 0.3)",
                    borderRadius: "12px",
                    color: "#EAF6FF",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#27F3D6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Historical logs table */}
      <GlassCard variant="strong">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Historical Email Logs</h3>
          <GlowButton variant="ghost" size="sm">
            <Download className="w-4 h-4" />
            Download All
          </GlowButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan/20">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Emails
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phishing Detected
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detection Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan/10">
              {historicalLogs.map((log) => (
                <tr key={log.id} className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-4 text-sm text-white">{log.date}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{log.total.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className="text-risk-high font-medium">{log.phishing}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {((log.phishing / log.total) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-4">
                    <NeonBadge variant="cyan">{log.status}</NeonBadge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <GlowButton variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </GlowButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
