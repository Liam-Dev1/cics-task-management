"use client"

import { useEffect, useState } from "react"
import { Clock, AlertCircle, CheckCircle } from "lucide-react"
import { Sidebar } from "@/components/sidebar-user" // Assuming you have a user sidebar
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { useRouter } from "next/navigation"
import NotificationsCard from "@/components/notifications-card"

// Task interface
interface Task {
  id: string
  name: string
  assignedBy: string
  assignedTo: string
  assignedToEmail: string
  assignedToId: string
  assignedOn: string
  deadline: string
  status: string
  priority: string
  description: string
  completed?: string | null
  files?: Array<{ name: string; url: string }>
}

// Notification interface
interface Notification {
  id: string
  type: string
  message: string
  date: string
  taskId?: string
  notificationDate: Date
  percentageComplete?: number
}

export default function UserDashboard() {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksNearDeadline, setTasksNearDeadline] = useState<Task[]>([])
  const [tasksOverdue, setTasksOverdue] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({
    tasksCompletedOnTimePercent: 0,
    tasksCompletedOverduePercent: 0,
    totalCompletedTasks: 0,
    onTimeCount: 0,
    overdueCount: 0,
  })
  const [userName, setUserName] = useState<string>("")

  const router = useRouter()

  // Fetch user's name from Firestore
  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.email) {
        try {
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("email", "==", user.email))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data()
            setUserName(userData.name || userData.displayName || user.displayName || "User")
          }
        } catch (error) {
          console.error("Error fetching user name:", error)
        }
      }
    }

    fetchUserName()
  }, [user])

  // Fetch tasks assigned to the user from Firestore
  const fetchTasks = async () => {
    if (!user?.email) return

    try {
      setLoading(true)
      const tasksCollection = collection(db, "tasks")

      // Query tasks assigned to the current user's email
      const tasksQuery = query(tasksCollection, where("assignedToEmail", "==", user.email), orderBy("deadline", "asc"))

      const querySnapshot = await getDocs(tasksQuery)

      const fetchedTasks: Task[] = []
      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Omit<Task, "id">
        fetchedTasks.push({
          id: doc.id,
          ...taskData,
        })
      })

      setTasks(fetchedTasks)

      // Process tasks for dashboard
      processTasksForDashboard(fetchedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch tasks when user is available
  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  // Update the calculateTaskStats function to work with the new statuses
  const calculateTaskStats = (tasks: Task[]) => {
    // Only consider completed tasks for the KPIs
    const completedTasks = tasks.filter(
      (task) => task.status === "Completed On Time" || task.status === "Completed Overdue",
    )

    // Count completed tasks that were done on time vs. overdue
    const onTimeCount = tasks.filter((task) => task.status === "Completed On Time").length
    const overdueCount = tasks.filter((task) => task.status === "Completed Overdue").length

    if (completedTasks.length === 0) {
      setStats({
        tasksCompletedOnTimePercent: 0,
        tasksCompletedOverduePercent: 0,
        totalCompletedTasks: 0,
        onTimeCount,
        overdueCount,
      })
      return
    }

    // Calculate percentages based only on completed tasks
    const totalCompletedTasks = completedTasks.length
    const tasksCompletedOnTimePercent = Math.round((onTimeCount / totalCompletedTasks) * 100)
    const tasksCompletedOverduePercent = Math.round((overdueCount / totalCompletedTasks) * 100)

    setStats({
      tasksCompletedOnTimePercent,
      tasksCompletedOverduePercent,
      totalCompletedTasks,
      onTimeCount,
      overdueCount,
    })
  }

  // Update the processTasksForDashboard function to handle the new statuses
  const processTasksForDashboard = (tasks: Task[]) => {
    // Calculate current date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate date 3 days from now for deadline warning
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    // Filter tasks near deadline (due within 3 days and not completed)
    const nearDeadline = tasks.filter((task) => {
      const dueDate = new Date(task.deadline)
      dueDate.setHours(0, 0, 0, 0)
      return (
        dueDate >= today &&
        dueDate <= threeDaysFromNow &&
        task.status !== "Completed On Time" &&
        task.status !== "Completed Overdue"
      )
    })

    // Filter overdue tasks (past deadline and not completed)
    const overdue = tasks.filter((task) => {
      const dueDate = new Date(task.deadline)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && task.status !== "Completed On Time" && task.status !== "Completed Overdue"
    })

    // Filter completed tasks
    const completed = tasks.filter((task) => task.status === "Completed On Time" || task.status === "Completed Overdue")

    setTasksNearDeadline(nearDeadline)
    setTasksOverdue(overdue)
    setCompletedTasks(completed)

    // Calculate statistics
    calculateTaskStats(tasks)

    // Generate notifications based on tasks
    generateNotificationsFromTasks(tasks)
  }

  // Calculate percentage of time elapsed between two dates
  const calculateTimeElapsedPercentage = (startDate: Date, endDate: Date, currentDate: Date): number => {
    const totalTime = endDate.getTime() - startDate.getTime()
    const elapsedTime = currentDate.getTime() - startDate.getTime()

    if (totalTime <= 0) return 100

    const percentage = (elapsedTime / totalTime) * 100
    return Math.min(Math.max(0, Math.round(percentage)), 100) // Ensure between 0-100
  }

  // Generate notifications from tasks
  const generateNotificationsFromTasks = (tasks: Task[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const notificationsList: Notification[] = []

    // Process each active task
    tasks
      .filter((task) => task.status !== "Completed")
      .forEach((task) => {
        const assignedDate = new Date(task.assignedOn)
        const deadlineDate = new Date(task.deadline)

        // Skip if deadline is in the past
        if (deadlineDate < today) {
          // Add overdue notification
          notificationsList.push({
            id: `overdue-${task.id}`,
            type: "High Priority",
            message: `Task "${task.name}" is overdue`,
            date: task.deadline,
            taskId: task.id,
            notificationDate: today,
            percentageComplete: 100,
          })
          return
        }

        // Calculate days until deadline
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate percentage of time elapsed
        const percentageComplete = calculateTimeElapsedPercentage(assignedDate, deadlineDate, today)

        // Create notifications based on days until deadline
        if (daysUntilDeadline <= 3) {
          // Determine notification type based on days remaining and priority
          let notificationType = "Low Priority"

          if (daysUntilDeadline <= 1) {
            notificationType = "High Priority"
          } else if (daysUntilDeadline <= 2 || task.priority === "High") {
            notificationType = "Medium Priority"
          }

          // Create notification
          notificationsList.push({
            id: `deadline-${task.id}`,
            type: notificationType,
            message:
              daysUntilDeadline === 1
                ? `Task "${task.name}" is due tomorrow`
                : `Task "${task.name}" is due in ${daysUntilDeadline} days`,
            date: task.deadline,
            taskId: task.id,
            notificationDate: today,
            percentageComplete: percentageComplete,
          })
        }
      })

    // Sort notifications by priority (High first) and then by deadline (earliest first)
    notificationsList.sort((a, b) => {
      // First sort by priority
      if (a.type.includes("High") && !b.type.includes("High")) return -1
      if (!a.type.includes("High") && b.type.includes("High")) return 1

      // Then by deadline date
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    setNotifications(notificationsList)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Handle view task - Updated to navigate to the tasks page with the taskId
  const handleViewTask = (taskId: string) => {
    // Navigate to the task page with the taskId as a query parameter
    router.push(`/task?taskId=${taskId}`)
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - Using grid layout instead of flex */}
      <div className="flex-1 bg-gray-100">
        <div className="grid grid-cols-[1fr_280px] h-screen">
          {/* Left column - Main dashboard content */}
          <div className="p-8 overflow-y-auto">
            {/* Dashboard header */}
            <div className="mb-6">
              <h1 className="mb-2">
                <span className="text-5xl font-bold">Dashboard</span>{" "}
                <span className="text-3xl text-red-800 font-bold">User</span>
              </h1>
              <h2 className="text-xl font-semibold mt-2">Tasks Assigned to You ({tasks.length})</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332]"></div>
              </div>
            ) : (
              <div>
                {/* KPI Cards */}
                <div className="flex gap-4 mb-8">
                  {/* On Time Stats */}
                  <div
                    className="flex-1 bg-[#8B2332] text-white p-6 rounded-md cursor-pointer hover:bg-[#7a1e2c] transition-colors"
                    onClick={() => router.push("/task?filter=Completed On Time")}
                    role="button"
                    tabIndex={0}
                    aria-label="View tasks completed on time"
                  >
                    <div className="text-5xl font-bold">{stats.tasksCompletedOnTimePercent}%</div>
                    <div className="text-sm mt-2">Tasks Performed on Time ({stats.onTimeCount})</div>
                  </div>

                  {/* Overdue Stats */}
                  <div
                    className="flex-1 bg-[#8B2332] text-white p-6 rounded-md cursor-pointer hover:bg-[#7a1e2c] transition-colors"
                    onClick={() => router.push("/task?filter=Completed Overdue")}
                    role="button"
                    tabIndex={0}
                    aria-label="View tasks completed overdue"
                  >
                    <div className="text-5xl font-bold">{stats.tasksCompletedOverduePercent}%</div>
                    <div className="text-sm mt-2">Tasks Performed Overdue ({stats.overdueCount})</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tasks Near Deadline */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Tasks Near Deadline</h2>
                    {tasksNearDeadline.length > 0 ? (
                      <div className="space-y-4">
                        {tasksNearDeadline.map((task) => (
                          <div key={task.id} className="bg-[#8B2332] text-white p-4 rounded-md">
                            <div className="flex items-start gap-2 mb-2">
                              <Clock className="h-5 w-5 mt-0.5" />
                              <div>
                                <div className="font-medium">{task.name}</div>
                                <div className="text-sm">
                                  Assigned on {formatDate(task.assignedOn)}
                                  <br />
                                  Deadline is {formatDate(task.deadline)}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleViewTask(task.id)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                              >
                                View Task
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-md text-gray-500 text-center">No tasks near deadline</div>
                    )}
                  </div>

                  {/* Tasks Overdue */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Tasks Overdue</h2>
                    {tasksOverdue.length > 0 ? (
                      <div className="space-y-4">
                        {tasksOverdue.map((task) => (
                          <div key={task.id} className="bg-[#8B2332] text-white p-4 rounded-md">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className="h-5 w-5 mt-0.5" />
                              <div>
                                <div className="font-medium">{task.name}</div>
                                <div className="text-sm">
                                  Assigned by: {task.assignedBy}
                                  <br />
                                  Deadline was: {formatDate(task.deadline)}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleViewTask(task.id)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                              >
                                View Task
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-md text-gray-500 text-center">No overdue tasks</div>
                    )}
                  </div>
                </div>

                {/* Recently Completed Tasks */}
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Recently Completed Tasks</h2>
                  {completedTasks.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {completedTasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="bg-white border p-4 rounded-md">
                          <div className="flex items-start gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                            <div>
                              <div className="font-medium">{task.name}</div>
                              <div className="text-sm text-gray-600">
                                Assigned by: {task.assignedBy}
                                <br />
                                Completed: {task.completed ? formatDate(task.completed) : "Unknown"}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleViewTask(task.id)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
                            >
                              View Task
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-md text-gray-500 text-center">No completed tasks</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Notifications card */}
          <div className="h-screen bg-white border-l">
            <div className="h-full p-4">
              <NotificationsCard
                notifications={notifications}
                loading={loading}
                onNotificationClick={handleViewTask}
                formatDate={formatDate}
                className="h-full"
                maxHeight="calc(100vh - 32px)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

