"use client"

import type React from "react"
import { Bell } from "lucide-react"

interface Notification {
  id: string
  type: string
  message: string
  date: string
  taskId?: string
  notificationDate: Date
  percentageComplete?: number
}

interface NotificationsCardProps {
  notifications: Notification[]
  loading: boolean
  onNotificationClick: (taskId: string) => void
  formatDate: (date: string) => string
  className?: string
  maxHeight?: string
}

const NotificationsCard: React.FC<NotificationsCardProps> = ({
  notifications,
  loading,
  onNotificationClick,
  formatDate,
  className = "",
  maxHeight = "500px",
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notifications
        </h2>
        {notifications.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{notifications.length}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ maxHeight }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8B2332]"></div>
          </div>
        ) : notifications.length > 0 ? (
          <ul className="divide-y">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => notification.taskId && onNotificationClick(notification.taskId)}
              >
                <div className="flex gap-3">
                  {/* Priority indicator - FIXED SIZE */}
                  <div
                    className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${
                      notification.type.includes("High")
                        ? "bg-red-500"
                        : notification.type.includes("Medium")
                          ? "bg-orange-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{notification.type}</div>
                    <div className="text-sm">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {notification.date ? `Due: ${formatDate(notification.date)}` : ""}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex justify-center items-center h-full text-gray-500">No notifications</div>
        )}
      </div>
    </div>
  )
}

export default NotificationsCard

