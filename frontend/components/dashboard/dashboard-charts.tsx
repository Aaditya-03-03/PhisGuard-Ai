"use client"

import { useMemo } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { RefreshCw } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { useDashboardData } from "@/contexts/dashboard-data-context"
import type { Email } from "@/lib/api"

interface DayDataPoint {
  date: string;
  dayName: string;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

// Get the past 7 days as an array of date strings
function getPast7Days(): { date: string; dayName: string }[] {
  const days: { date: string; dayName: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    })
  }
  return days
}

// Group emails by date (past 7 days)
function groupEmailsByDay(emails: Email[]): DayDataPoint[] {
  const past7Days = getPast7Days()
  const groupedData: Record<string, { high: number; medium: number; low: number }> = {}

  past7Days.forEach(day => {
    groupedData[day.date] = { high: 0, medium: 0, low: 0 }
  })

  emails.forEach(email => {
    if (!email.receivedAt) return

    const emailDate = new Date(email.receivedAt).toISOString().split('T')[0]

    if (groupedData[emailDate]) {
      const riskLevel = email.riskLevel?.toUpperCase() || 'LOW'
      if (riskLevel === 'HIGH') {
        groupedData[emailDate].high++
      } else if (riskLevel === 'MEDIUM') {
        groupedData[emailDate].medium++
      } else {
        groupedData[emailDate].low++
      }
    }
  })

  return past7Days.map(day => ({
    date: day.date,
    dayName: day.dayName,
    ...groupedData[day.date],
    total: groupedData[day.date].high + groupedData[day.date].medium + groupedData[day.date].low
  }))
}

export function DashboardCharts() {
  const { data } = useDashboardData()
  const { scanResult, isLoading, lastUpdated, hasNewData } = data

  // Process chart data from context
  const chartData = useMemo(() => {
    if (scanResult?.results && scanResult.results.length > 0) {
      return groupEmailsByDay(scanResult.results)
    }
    return getPast7Days().map(day => ({
      date: day.date,
      dayName: day.dayName,
      high: 0,
      medium: 0,
      low: 0,
      total: 0
    }))
  }, [scanResult])

  const pieChartData = useMemo(() => {
    if (scanResult?.summary) {
      const pieData: PieDataPoint[] = [
        { name: "High Risk", value: scanResult.summary.high, color: "#ff4757" },
        { name: "Medium Risk", value: scanResult.summary.medium, color: "#ffa502" },
        { name: "Low Risk", value: scanResult.summary.low, color: "#2ed573" },
      ].filter(item => item.value > 0)

      if (pieData.length === 0) {
        pieData.push({ name: "No Data", value: 1, color: "#27F3D6" })
      }
      return pieData
    }
    return [{ name: "No Data", value: 1, color: "#27F3D6" }]
  }, [scanResult])

  if (isLoading) {
    return (
      <>
        <GlassCard variant="strong">
          <div className="flex items-center justify-center h-72">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan" />
          </div>
        </GlassCard>
        <GlassCard variant="strong">
          <div className="flex items-center justify-center h-72">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan" />
          </div>
        </GlassCard>
      </>
    )
  }

  return (
    <>
      {/* Bar Chart - Emails per Day (Past 7 Days) */}
      <GlassCard variant="strong" className={hasNewData ? 'ring-2 ring-cyan/50' : ''}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Emails by Day (Past 7 Days)</h3>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live • {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="h-72">
          {chartData.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(39, 243, 214, 0.1)" />
                <XAxis
                  dataKey="dayName"
                  stroke="rgba(234, 246, 255, 0.5)"
                  fontSize={11}
                  tickFormatter={(value) => value.split(' ')[0]}
                />
                <YAxis stroke="rgba(234, 246, 255, 0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(16, 24, 40, 0.95)",
                    border: "1px solid rgba(39, 243, 214, 0.3)",
                    borderRadius: "12px",
                    color: "#EAF6FF",
                  }}
                  labelFormatter={(label) => `📅 ${label}`}
                />
                <Bar dataKey="high" stackId="a" fill="#ff4757" name="High Risk" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill="#ffa502" name="Medium Risk" radius={[0, 0, 0, 0]} />
                <Bar dataKey="low" stackId="a" fill="#2ed573" name="Low Risk" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No emails in the past 7 days</p>
              <p className="text-sm">Scan your inbox to see trends</p>
            </div>
          )}
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

      {/* Pie Chart - Risk Distribution */}
      <GlassCard variant="strong" className={hasNewData ? 'ring-2 ring-cyan/50' : ''}>
        <h3 className="text-lg font-semibold text-white mb-6">Overall Risk Distribution</h3>
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
                  backgroundColor: "rgba(16, 24, 40, 0.95)",
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
              <span className="text-muted-foreground">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  )
}
