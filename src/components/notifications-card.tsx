"use client"

import { Circle } from "lucide-react"

export interface Notification {
  id: string
  type: string
  message: string
  date: string
  taskId?: string
  notificationDate: Date
  percentageComplete?: number
}

export interface NotificationsCardProps {
  notifications?: Notification[]
  loading?: boolean
  onNotificationClick?: (taskId: string) => void
  formatDate?: (date: string) => string
  className?: string
  maxHeight?: string | number
}

export default function NotificationsCard({
  notifications = [],
  loading = false,
  onNotificationClick,
  formatDate = (date) => new Date(date).toLocaleDateString(),
  className = "",
  maxHeight = "calc(100vh - 200px)",
}: NotificationsCardProps) {
  // Convert maxHeight to string with px if it's a number
  const heightStyle = typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Notifications</h2>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8B2332]"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: heightStyle }}>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3"
                onClick={() => notification.taskId && onNotificationClick?.(notification.taskId)}
              >
                <Circle
                  className={`h-5 w-5 mt-0.5 fill-current ${
                    notification.type.includes("High") || notification.type.includes("overdue")
                      ? "text-red-500"
                      : notification.type.includes("Medium")
                        ? "text-orange-500"
                        : "text-green-500"
                  }`}
                />
                <div>
                  <div className="font-medium text-sm">{notification.type.replace(" Priority", "")}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex justify-center items-center text-gray-500">No notifications</div>
      )}
    </div>
  )
}

