"use client"

import { GlassCard } from "@/components/ui/glass-card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const lineChartData = [
  { date: "Mon", phishing: 12, safe: 245 },
  { date: "Tue", phishing: 19, safe: 312 },
  { date: "Wed", phishing: 8, safe: 287 },
  { date: "Thu", phishing: 24, safe: 356 },
  { date: "Fri", phishing: 15, safe: 298 },
  { date: "Sat", phishing: 6, safe: 189 },
  { date: "Sun", phishing: 9, safe: 167 },
]

const pieChartData = [
  { name: "High Risk", value: 234, color: "#ff4757" },
  { name: "Medium Risk", value: 89, color: "#ffa502" },
  { name: "Low Risk", value: 156, color: "#2ed573" },
  { name: "Safe", value: 12368, color: "#27F3D6" },
]

export function DashboardCharts() {
  return (
    <>
      {/* Line Chart - Phishing per day */}
      <GlassCard variant="strong">
        <h3 className="text-lg font-semibold text-white mb-6">Phishing Emails Per Day</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(39, 243, 214, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(234, 246, 255, 0.5)" fontSize={12} />
              <YAxis stroke="rgba(234, 246, 255, 0.5)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(16, 24, 40, 0.9)",
                  border: "1px solid rgba(39, 243, 214, 0.3)",
                  borderRadius: "12px",
                  color: "#EAF6FF",
                }}
              />
              <Line
                type="monotone"
                dataKey="phishing"
                stroke="#ff4757"
                strokeWidth={3}
                dot={{ fill: "#ff4757", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#ff4757", stroke: "#0A0F1F", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="safe"
                stroke="#27F3D6"
                strokeWidth={3}
                dot={{ fill: "#27F3D6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#27F3D6", stroke: "#0A0F1F", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-risk-high" />
            <span className="text-muted-foreground">Phishing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan" />
            <span className="text-muted-foreground">Safe</span>
          </div>
        </div>
      </GlassCard>

      {/* Pie Chart - Risk Distribution */}
      <GlassCard variant="strong">
        <h3 className="text-lg font-semibold text-white mb-6">Risk Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(16, 24, 40, 0.9)",
                  border: "1px solid rgba(39, 243, 214, 0.3)",
                  borderRadius: "12px",
                  color: "#EAF6FF",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
          {pieChartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  )
}
