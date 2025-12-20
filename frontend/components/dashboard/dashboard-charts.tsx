"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { RefreshCw } from "lucide-react"
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
import { getScanHistory, getLatestScan, type ScanResult } from "@/lib/api"

interface ChartDataPoint {
  date: string;
  phishing: number;
  safe: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export function DashboardCharts() {
  const [lineChartData, setLineChartData] = useState<ChartDataPoint[]>([])
  const [pieChartData, setPieChartData] = useState<PieDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChartData() {
      try {
        // Get scan history for line chart (last 7 scans)
        const history = await getScanHistory(7)

        if (history && history.length > 0) {
          // Create line chart data from scan history
          const lineData: ChartDataPoint[] = history.map((scan: ScanResult) => {
            const date = new Date(scan.scannedAt)
            return {
              date: date.toLocaleDateString('en-US', { weekday: 'short' }),
              phishing: scan.summary.high + scan.summary.medium,
              safe: scan.summary.low
            }
          }).reverse() // Oldest first

          setLineChartData(lineData)
        }

        // Get latest scan for pie chart
        const latestScan = await getLatestScan()

        if (latestScan && latestScan.summary) {
          const pieData: PieDataPoint[] = [
            { name: "High Risk", value: latestScan.summary.high, color: "#ff4757" },
            { name: "Medium Risk", value: latestScan.summary.medium, color: "#ffa502" },
            { name: "Low Risk", value: latestScan.summary.low, color: "#2ed573" },
          ].filter(item => item.value > 0) // Only show non-zero values

          // If no data, show placeholder
          if (pieData.length === 0) {
            pieData.push({ name: "No Data", value: 1, color: "#27F3D6" })
          }

          setPieChartData(pieData)
        } else {
          // Default empty state
          setPieChartData([{ name: "No Data", value: 1, color: "#27F3D6" }])
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error)
        // Set empty state on error
        setPieChartData([{ name: "No Data", value: 1, color: "#27F3D6" }])
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchChartData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
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
      {/* Line Chart - Phishing per day */}
      <GlassCard variant="strong">
        <h3 className="text-lg font-semibold text-white mb-6">Phishing Emails Per Scan</h3>
        <div className="h-72">
          {lineChartData.length > 0 ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No scan history yet</p>
              <p className="text-sm">Scan your inbox to see trends</p>
            </div>
          )}
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
              <span className="text-muted-foreground">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  )
}
