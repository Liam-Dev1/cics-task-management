"use client"

import { Clock, AlertCircle, Bell } from "lucide-react"
import { calculateStats, getTasksNearDeadline, getOverdueTasks, formatDate, generateNotifications } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar-admin"
import type { Task, Notification } from "@/lib/utils"

export default function Dashboard() {
  const stats = calculateStats()
  const tasksNearDeadline: Task[] = getTasksNearDeadline()
  const tasksOverdue: Task[] = getOverdueTasks()
  const notifications: Notification[] = generateNotifications(5)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar imported from sidebar.tsx */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">
        <div className="p-8">
          {/* Updated header with Admin text */}
          <div className="flex items-baseline gap-4 mb-4">
            <h1 className="text-5xl font-bold text-[#333333]">Dashboard</h1>
            <span className="text-4xl font-bold text-[#8B2332]">Admin</span>
          </div>

          {/* Tasks Assigned to You */}
          <h2 className="text-xl font-semibold mb-4">Tasks You Assigned</h2>


          <div className="flex gap-4 mb-8">
            {/* On Time Stats */}
            <div className="flex-1 bg-[#8B2332] text-white p-6 rounded-md">
              <div className="text-7xl font-bold">{stats.tasksPerformedOnTime}%</div>
              <div className="text-lg">
                Tasks Performed
                <br />
                on Time
              </div>
            </div>

            {/* Overdue Stats */}
            <div className="flex-1 bg-[#8B2332] text-white p-6 rounded-md">
              <div className="text-7xl font-bold">{stats.tasksPerformedOverdue}%</div>
              <div className="text-lg">
                Tasks Performed
                <br />
                Overdue
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Tasks Near Deadline */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Tasks Near Deadline</h2>
              <div className="space-y-4">
                {tasksNearDeadline.map((task: Task) => (
                  <div key={task.id} className="bg-[#8B2332] text-white p-4 rounded-md">
                    <div className="flex items-start gap-2 mb-2">
                      <Clock className="h-5 w-5 mt-0.5" />
                      <div>
                        <div className="font-medium">Task #{task.id}</div>
                        <div className="text-sm">
                          Assigned on {formatDate(task.assignedDate)}
                          <br />
                          Deadline is {formatDate(task.dueDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
                        View Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks Overdue */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Tasks Overdue</h2>
              <div className="space-y-4">
                {tasksOverdue.map((task: Task) => (
                  <div key={task.id} className="bg-[#8B2332] text-white p-4 rounded-md">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 mt-0.5" />
                      <div>
                        <div className="font-medium">Task #{task.id}</div>
                        <div className="text-sm">
                          Assigned on {formatDate(task.assignedDate)}
                          <br />
                          Deadline was {formatDate(task.dueDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
                        View Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="w-72 bg-white border-l p-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div key={notification.id} className="border p-4 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 ${
                      notification.type.includes("High")
                        ? "bg-red-600"
                        : notification.type.includes("Medium")
                          ? "bg-orange-500"
                          : "bg-blue-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium">{notification.type}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">Due: {formatDate(notification.date)}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">No notifications</div>
          )}

          {notifications.length > 0 && (
            <button className="w-full text-center text-sm text-[#8B2332] hover:underline mt-2">
              View all notifications
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

