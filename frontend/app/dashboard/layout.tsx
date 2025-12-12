"use client"

import type React from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-navy cyber-grid">
        <DashboardSidebar />
        <main className="lg:ml-64 min-h-screen transition-all duration-300">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

