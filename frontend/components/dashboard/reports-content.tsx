"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { NeonBadge } from "@/components/ui/neon-badge"
import { Calendar, Download, FileText, FileSpreadsheet, RefreshCw, Inbox, Mail, Send } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getLatestScan, getResultsByPlatform, type Email, type PhishingResult, type ScanResult } from "@/lib/api"
import type { Platform } from "@/components/dashboard/platform-selector"

interface ReportsContentProps {
  platform?: Platform
}

interface DayDataPoint {
  date: string;
  dayName: string;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface HistoricalLog {
  id: string;
  date: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  status: string;
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

// Group data by date (past 7 days)
function groupByDay(emails: Email[]): DayDataPoint[] {
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

// Convert PhishingResult to Email format
function convertToEmail(result: PhishingResult): Email {
  return {
    id: result.id,
    gmailId: result.id,
    messageId: result.id,
    sender: `${result.platform}@phishguard`,
    senderName: result.platform.charAt(0).toUpperCase() + result.platform.slice(1),
    subject: result.content.substring(0, 80),
    body: result.content,
    receivedAt: result.createdAt,
    processedAt: result.createdAt,
    riskLevel: result.risk,
    phishingScore: result.confidence,
    flags: result.reasons,
    urlCount: 0,
    urls: []
  }
}

// Export to CSV function
function exportToCSV(logs: HistoricalLog[], platformLabel: string) {
  if (logs.length === 0) {
    alert('No data to export')
    return
  }

  const headers = ['Date', `Total ${platformLabel}`, 'High Risk', 'Medium Risk', 'Low Risk', 'Status']
  const csvRows = [
    headers.join(','),
    ...logs.map(log => [
      `"${log.date}"`,
      log.total,
      log.high,
      log.medium,
      log.low,
      log.status
    ].join(','))
  ]

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `phishguard-${platformLabel.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export to PDF function
function exportToPDF(logs: HistoricalLog[], platformLabel: string) {
  if (logs.length === 0) {
    alert('No data to export')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export PDF')
    return
  }

  const totalHigh = logs.reduce((sum, log) => sum + log.high, 0)
  const totalMedium = logs.reduce((sum, log) => sum + log.medium, 0)
  const totalLow = logs.reduce((sum, log) => sum + log.low, 0)
  const totalMessages = logs.reduce((sum, log) => sum + log.total, 0)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PhishGuard AI - ${platformLabel} Security Report (Past 7 Days)</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #0a0f1f; border-bottom: 3px solid #27f3d6; padding-bottom: 10px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center; flex: 1; }
        .stat-value { font-size: 32px; font-weight: bold; }
        .high { color: #ff4757; }
        .medium { color: #ffa502; }
        .low { color: #2ed573; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #0a0f1f; color: white; }
        tr:hover { background: #f5f5f5; }
        .footer { margin-top: 30px; color: #666; font-size: 12px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <h1>🛡️ PhishGuard AI - ${platformLabel} Security Report (Past 7 Days)</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      
      <div class="summary">
        <div class="stat-box">
          <div class="stat-value">${logs.length}</div>
          <div>Days with Data</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${totalMessages}</div>
          <div>${platformLabel} Analyzed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value high">${totalHigh}</div>
          <div>High Risk</div>
        </div>
        <div class="stat-box">
          <div class="stat-value medium">${totalMedium}</div>
          <div>Medium Risk</div>
        </div>
        <div class="stat-box">
          <div class="stat-value low">${totalLow}</div>
          <div>Low Risk</div>
        </div>
      </div>

      <h2>Daily Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Total</th>
            <th>High Risk</th>
            <th>Medium Risk</th>
            <th>Low Risk</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${log.date}</td>
              <td>${log.total}</td>
              <td class="high">${log.high}</td>
              <td class="medium">${log.medium}</td>
              <td class="low">${log.low}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by PhishGuard AI - AI-Powered Phishing Detection System</p>
      </div>

      <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #27f3d6; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        Print / Save as PDF
      </button>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

export function ReportsContent({ platform = "email" }: ReportsContentProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Platform-specific labels
  const platformLabels = useMemo(() => {
    switch (platform) {
      case "telegram":
        return {
          messages: "Messages",
          emptyTitle: "No Telegram messages in the past 7 days",
          emptyHint: "Messages scanned via the Telegram bot will appear here",
          icon: Send
        }
      default:
        return {
          messages: "Emails",
          emptyTitle: "No emails in the past 7 days",
          emptyHint: "Scan your inbox to see reports",
          icon: Mail
        }
    }
  }, [platform])

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    setIsLoading(true)

    try {
      let allEmails: Email[] = []

      if (platform === "email") {
        // Email uses existing scan endpoints
        const { getScanHistory, getLatestScan } = await import("@/lib/api")
        const scanHistory = await getScanHistory(10)

        if (scanHistory && scanHistory.length > 0) {
          const emailMap = new Map()
          scanHistory.forEach(scan => {
            if (scan.results && Array.isArray(scan.results)) {
              scan.results.forEach((email: Email) => {
                const key = email.gmailId || email.id || email.messageId
                if (key && !emailMap.has(key)) {
                  emailMap.set(key, email)
                }
              })
            }
          })
          allEmails = Array.from(emailMap.values())
        }

        if (allEmails.length === 0) {
          const latestScan = await getLatestScan()
          if (latestScan && latestScan.results) {
            allEmails = latestScan.results
          }
        }
      } else {
        // Telegram uses platform-specific endpoint
        const results = await getResultsByPlatform(platform, 500)
        allEmails = results.map(convertToEmail)
      }

      setEmails(allEmails)
      setLastUpdated(new Date())
    } catch (error) {
      console.error(`Failed to fetch ${platform} data:`, error)
      setEmails([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [platform])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Process chart data
  const chartData = useMemo(() => {
    if (emails.length > 0) {
      return groupByDay(emails)
    }
    return getPast7Days().map(day => ({
      date: day.date,
      dayName: day.dayName,
      high: 0,
      medium: 0,
      low: 0,
      total: 0
    }))
  }, [emails])

  // Create historical logs for exports
  const historicalLogs: HistoricalLog[] = useMemo(() => {
    return chartData.map((day, index) => ({
      id: `day-${index}`,
      date: day.dayName,
      total: day.total,
      high: day.high,
      medium: day.medium,
      low: day.low,
      status: day.total > 0 ? 'Has Data' : `No ${platformLabels.messages}`
    }))
  }, [chartData, platformLabels.messages])

  // Calculate totals
  const totalMessages = emails.length
  const totalHigh = emails.filter(e => e.riskLevel?.toUpperCase() === 'HIGH').length
  const totalMedium = emails.filter(e => e.riskLevel?.toUpperCase() === 'MEDIUM').length

  const PlatformIcon = platformLabels.icon

  if (isLoading) {
    return (
      <div className="space-y-6">
        <GlassCard variant="strong">
          <div className="flex items-center justify-center h-72">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan" />
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <PlatformIcon className="w-5 h-5 text-cyan" />
            <span className="text-white font-medium">
              Past 7 Days {platform === "email" ? "Email" : "Telegram"} Report
            </span>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Updated • {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <GlowButton
              variant="ghost"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </GlowButton>
            <GlowButton variant="secondary" size="sm" onClick={() => exportToPDF(historicalLogs, platformLabels.messages)}>
              <FileText className="w-4 h-4" />
              Export PDF
            </GlowButton>
            <GlowButton variant="secondary" size="sm" onClick={() => exportToCSV(historicalLogs, platformLabels.messages)}>
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <GlassCard variant="strong">
          <h3 className="text-lg font-semibold text-white mb-6">Risk Distribution by Day (Past 7 Days)</h3>
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
                <PlatformIcon className="w-12 h-12 mb-4 opacity-50" />
                <p>{platformLabels.emptyTitle}</p>
                <p className="text-sm">{platformLabels.emptyHint}</p>
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

        {/* Area chart */}
        <GlassCard variant="strong">
          <h3 className="text-lg font-semibold text-white mb-6">{platformLabels.messages} Over Time (Past 7 Days)</h3>
          <div className="h-72">
            {chartData.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.map(d => ({
                  dayName: d.dayName,
                  total: d.total,
                  phishing: d.high + d.medium
                }))}>
                  <defs>
                    <linearGradient id="colorTotalReport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#27F3D6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#27F3D6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPhishingReport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4757" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#27F3D6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotalReport)"
                    name={`Total ${platformLabels.messages}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="phishing"
                    stroke="#ff4757"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPhishingReport)"
                    name="Phishing Detected"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <PlatformIcon className="w-12 h-12 mb-4 opacity-50" />
                <p>{platformLabels.emptyTitle}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan" />
              <span className="text-muted-foreground">Total {platformLabels.messages}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-risk-high" />
              <span className="text-muted-foreground">Phishing</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Daily breakdown table */}
      <GlassCard variant="strong">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Daily Breakdown (Past 7 Days)</h3>
          <GlowButton variant="ghost" size="sm" onClick={() => exportToCSV(historicalLogs, platformLabels.messages)}>
            <Download className="w-4 h-4" />
            Download
          </GlowButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan/20">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Day
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total {platformLabels.messages}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  High Risk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Medium Risk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Low Risk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan/10">
              {chartData.map((day, index) => (
                <tr key={index} className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-4 text-sm text-white">{day.dayName}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{day.total}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className="text-risk-high font-medium">{day.high}</span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="text-risk-medium font-medium">{day.medium}</span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="text-risk-low font-medium">{day.low}</span>
                  </td>
                  <td className="px-4 py-4">
                    <NeonBadge variant={day.total > 0 ? "cyan" : "low"}>
                      {day.total > 0 ? 'Has Data' : `No ${platformLabels.messages}`}
                    </NeonBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Summary stats */}
      <GlassCard variant="strong">
        <h3 className="text-lg font-semibold text-white mb-4">7-Day Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-navy/50 rounded-xl">
            <p className="text-3xl font-bold text-white">{totalMessages}</p>
            <p className="text-sm text-muted-foreground">Total {platformLabels.messages}</p>
          </div>
          <div className="text-center p-4 bg-navy/50 rounded-xl">
            <p className="text-3xl font-bold text-risk-high">{totalHigh}</p>
            <p className="text-sm text-muted-foreground">High Risk</p>
          </div>
          <div className="text-center p-4 bg-navy/50 rounded-xl">
            <p className="text-3xl font-bold text-risk-medium">{totalMedium}</p>
            <p className="text-sm text-muted-foreground">Medium Risk</p>
          </div>
          <div className="text-center p-4 bg-navy/50 rounded-xl">
            <p className="text-3xl font-bold text-risk-low">{totalMessages - totalHigh - totalMedium}</p>
            <p className="text-sm text-muted-foreground">Low Risk</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
