"use client"

import TaskReportDashboard from "@/components/task-report-dashboard"
import { Sidebar } from "@/components/sidebar-admin"
import { useState } from "react"

export default function ReportsPage() {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)

  const handleSidebarMinimize = (isMinimized: boolean) => {
    setIsSidebarMinimized(isMinimized)
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="transition-all duration-300">
        <Sidebar onMinimize={handleSidebarMinimize} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 bg-gray-100 transition-all duration-300 ${
          isSidebarMinimized ? "ml-16" : "ml-64"
        }`}
      >
        <TaskReportDashboard />
      </div>
    </div>
  )
}