"use client"

import { useEffect, useState } from "react"
import { Clock, AlertCircle } from "lucide-react"
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
  notificationDate: Date // Date when notification should be shown
  percentageComplete?: number // For displaying percentage of time elapsed
}

export default function Dashboard() {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksNearDeadline, setTasksNearDeadline] = useState<Task[]>([])
  const [tasksOverdue, setTasksOverdue] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({
    tasksCompletedOnTimePercent: 0,
    tasksCompletedOverduePercent: 0,
    totalCompletedTasks: 0,
    onTimeCount: 0,
    overdueCount: 0,
  })
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")

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
            setUserName(userData.name || userData.displayName || user.displayName || "Admin User")
            setUserRole(userData.role || "admin")
          }
        } catch (error) {
          console.error("Error fetching user name:", error)
        }
      }
    }

    fetchUserName()
  }, [user])

  // Fetch tasks from Firestore
  const fetchTasks = async () => {
    if (!user) return

    try {
      setLoading(true)
      const tasksCollection = collection(db, "tasks")

      // Use a simpler query without the where clause to avoid index issues
      const tasksQuery = query(tasksCollection, orderBy("assignedOn", "desc"))

      const querySnapshot = await getDocs(tasksQuery)

      const fetchedTasks: Task[] = []
      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Omit<Task, "id">
        fetchedTasks.push({
          id: doc.id,
          ...taskData,
        })
      })

      // Filter tasks assigned by the current user in memory
      const userTasks = fetchedTasks.filter((task) => task.assignedBy === userName)

      // Debug log to check task statuses
      console.log("All tasks:", fetchedTasks.length)
      console.log("User tasks:", userTasks.length)
      console.log("Completed On Time:", userTasks.filter((task) => task.status === "Completed On Time").length)
      console.log("Completed Overdue:", userTasks.filter((task) => task.status === "Completed Overdue").length)

      setTasks(userTasks)

      // Process tasks for dashboard
      processTasksForDashboard(userTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch tasks from Firestore
  useEffect(() => {
    // Only fetch tasks once we have the user name
    if (userName) {
      fetchTasks()
    }
  }, [user, userName])

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

    setTasksNearDeadline(nearDeadline)
    setTasksOverdue(overdue)

    // Calculate statistics
    calculateTaskStats(tasks)

    // Generate notifications based on tasks
    generateNotificationsFromTasks(tasks)
  }

  // Calculate task statistics

  // Calculate working days between two dates (excluding weekends)
  const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
    let count = 0
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      // 0 = Sunday, 6 = Saturday
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return count
  }

  // Calculate notification dates based on priority and working days
  const calculateNotificationDates = (task: Task): Date[] => {
    const assignedDate = new Date(task.assignedOn)
    const deadlineDate = new Date(task.deadline)

    // Calculate total working days
    const totalWorkingDays = calculateWorkingDays(assignedDate, deadlineDate)

    // Calculate day before deadline
    const dayBeforeDeadline = new Date(deadlineDate)
    dayBeforeDeadline.setDate(dayBeforeDeadline.getDate() - 1)

    // Initialize notification dates array with day before deadline
    const notificationDates: Date[] = [dayBeforeDeadline]

    // Calculate notification dates based on priority
    if (totalWorkingDays > 1) {
      // For all priorities, calculate 25% date
      const days25Percent = Math.round(totalWorkingDays * 0.25)
      const date25Percent = getDateAfterWorkingDays(assignedDate, days25Percent)
      notificationDates.push(date25Percent)

      // For medium and high priorities, calculate 50% date
      if (task.priority === "Medium" || task.priority === "High") {
        const days50Percent = Math.round(totalWorkingDays * 0.5)
        const date50Percent = getDateAfterWorkingDays(assignedDate, days50Percent)
        notificationDates.push(date50Percent)
      }

      // For high priority only, calculate 75% date
      if (task.priority === "High") {
        const days75Percent = Math.round(totalWorkingDays * 0.75)
        const date75Percent = getDateAfterWorkingDays(assignedDate, days75Percent)
        notificationDates.push(date75Percent)
      }
    }

    return notificationDates
  }

  // Get date after specified number of working days
  const getDateAfterWorkingDays = (startDate: Date, workingDays: number): Date => {
    let daysAdded = 0
    const resultDate = new Date(startDate)

    while (daysAdded < workingDays) {
      resultDate.setDate(resultDate.getDate() + 1)
      // Skip weekends
      if (resultDate.getDay() !== 0 && resultDate.getDay() !== 6) {
        daysAdded++
      }
    }

    return resultDate
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

        // Calculate notification dates based on priority
        const notificationDates = calculateNotificationDates(task)

        // Check if today matches any notification date
        notificationDates.forEach((notificationDate) => {
          // Format dates to compare only year, month, and day
          const notificationDateStr = notificationDate.toISOString().split("T")[0]
          const todayStr = today.toISOString().split("T")[0]

          if (notificationDateStr === todayStr) {
            // Calculate days until deadline
            const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            // Calculate percentage of time elapsed
            const percentageComplete = calculateTimeElapsedPercentage(assignedDate, deadlineDate, today)

            // Determine notification type based on days remaining
            let notificationType = "Low Priority"
            if (daysUntilDeadline <= 1) {
              notificationType = "High Priority"
            } else if (daysUntilDeadline <= 3) {
              notificationType = "Medium Priority"
            }

            // Create notification
            notificationsList.push({
              id: `deadline-${task.id}-${notificationDateStr}`,
              type: notificationType,
              message:
                daysUntilDeadline === 1
                  ? `Task "${task.name}" is due tomorrow`
                  : `Task "${task.name}" is due in ${daysUntilDeadline} days`,
              date: task.deadline,
              taskId: task.id,
              notificationDate: notificationDate,
              percentageComplete: percentageComplete,
            })
          }
        })
      })

    // Sort notifications by priority (High first) and then by deadline (earliest first)
    notificationsList.sort((a, b) => {
      // First sort by priority
      if (a.type.includes("High") && !b.type.includes("High")) return -1
      if (!a.type.includes("High") && b.type.includes("High")) return 1

      // Then by deadline date
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    setNotifications(notificationsList) // Don't limit notifications
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Update the handleViewTask function to navigate to the task management page with the taskId
  const handleViewTask = (taskId: string) => {
    // Navigate to the task page with the taskId as a query parameter
    router.push(`/task?taskId=${taskId}`)
  }

  return (
    <div className="flex-1 bg-gray-100">
      <div className="grid grid-cols-[1fr_280px] h-screen">
        {/* Left column - Main dashboard content */}
        <div className="p-8 overflow-y-auto">
          {/* Dashboard header */}
          <div className="mb-6">
            <h1 className="mb-2">
              <span className="text-5xl font-bold">Dashboard</span>{" "}
              <span className="text-3xl text-red-800 font-bold">
                {userRole === "super admin" ? "Super Admin" : "Admin"}
              </span>
            </h1>
            <h2 className="text-xl font-semibold mt-2">Tasks You Assigned ({tasks.length})</h2>
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
                                Assigned on {formatDate(task.assignedOn)}
                                <br />
                                Deadline was {formatDate(task.deadline)}
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
  )
}

