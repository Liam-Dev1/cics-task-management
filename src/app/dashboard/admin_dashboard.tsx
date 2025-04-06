"use client"

import { useEffect, useState } from "react"
import { Clock, AlertCircle, CheckCircle, Users, BarChart2 } from "lucide-react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/firebase.config"
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

// User interface
interface User {
  id: string
  name: string
  email: string
  role: string
  profilePhoto?: string
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

export default function AdminDashboard() {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tasksNearDeadline, setTasksNearDeadline] = useState<Task[]>([])
  const [tasksOverdue, setTasksOverdue] = useState<Task[]>([])
  const [tasksPending, setTasksPending] = useState<Task[]>([])
  const [tasksVerifying, setTasksVerifying] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
    verifyingTasks: 0
  })

  const router = useRouter()

  // Fetch tasks and users from Firestore
  const fetchData = async () => {
    if (!user?.email) return

    try {
      setLoading(true)
      const tasksCollection = collection(db, "tasks")
      const usersCollection = collection(db, "users")

      // Get all tasks
      const tasksQuery = query(tasksCollection, orderBy("deadline", "asc"))
      const tasksSnapshot = await getDocs(tasksQuery)
      
      const fetchedTasks: Task[] = []
      tasksSnapshot.forEach((doc) => {
        const taskData = doc.data() as Omit<Task, "id">
        fetchedTasks.push({
          id: doc.id,
          ...taskData,
        })
      })
      
      setTasks(fetchedTasks)

      // Get all users except current user
      const usersQuery = query(usersCollection)
      const usersSnapshot = await getDocs(usersQuery)
      
      const fetchedUsers: User[] = []
      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as Omit<User, "id">
        fetchedUsers.push({
          id: doc.id,
          ...userData,
        })
      })
      
      setUsers(fetchedUsers)

      // Process tasks for dashboard
      processTasksForDashboard(fetchedTasks, fetchedUsers)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when user is available
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // Calculate task statistics
  const processTasksForDashboard = (tasks: Task[], users: User[]) => {
    // Calculate current date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate date 3 days from now for deadline warning
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    // Filter tasks by various criteria
    const nearDeadline = tasks.filter((task) => {
      const dueDate = new Date(task.deadline)
      dueDate.setHours(0, 0, 0, 0)
      return (
        dueDate >= today &&
        dueDate <= threeDaysFromNow &&
        task.status !== "Completed On Time" &&
        task.status !== "Completed Overdue"
      )
    }).slice(0, 5)

    const overdue = tasks.filter((task) => {
      const dueDate = new Date(task.deadline)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && task.status !== "Completed On Time" && task.status !== "Completed Overdue"
    }).slice(0, 5)

    const pending = tasks.filter(task => task.status === "Pending").slice(0, 5)
    const verifying = tasks.filter(task => task.status === "Verifying").slice(0, 5)

    setTasksNearDeadline(nearDeadline)
    setTasksOverdue(overdue)
    setTasksPending(pending)
    setTasksVerifying(verifying)

    // Calculate statistics
    const totalTasks = tasks.length
    const pendingTasks = tasks.filter(task => task.status === "Pending").length
    const verifyingTasks = tasks.filter(task => task.status === "Verifying").length
    const completedTasks = tasks.filter(task => 
      task.status === "Completed On Time" || task.status === "Completed Overdue"
    ).length
    const overdueTasks = tasks.filter(task => {
      const dueDate = new Date(task.deadline)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && task.status !== "Completed On Time" && task.status !== "Completed Overdue"
    }).length
    const totalUsers = users.length

    setStats({
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      totalUsers,
      verifyingTasks
    })

    // Generate notifications
    generateNotificationsFromTasks(tasks)
  }

  // Generate notifications from tasks
  const generateNotificationsFromTasks = (tasks: Task[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const notificationsList: Notification[] = []

    // Add verifying tasks notifications
    tasks.filter(task => task.status === "Verifying").forEach(task => {
      notificationsList.push({
        id: `verify-${task.id}`,
        type: "High Priority",
        message: `Task "${task.name}" needs verification from ${task.assignedTo}`,
        date: task.deadline,
        taskId: task.id,
        notificationDate: today
      })
    })

    // Add overdue task notifications
    tasks.filter(task => {
      const dueDate = new Date(task.deadline)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && task.status !== "Completed On Time" && task.status !== "Completed Overdue"
    }).forEach(task => {
      notificationsList.push({
        id: `overdue-${task.id}`,
        type: "Medium Priority",
        message: `Task "${task.name}" assigned to ${task.assignedTo} is overdue`,
        date: task.deadline,
        taskId: task.id,
        notificationDate: today
      })
    })

    // Add tasks near deadline
    tasks.filter(task => {
      const dueDate = new Date(task.deadline)
      dueDate.setHours(0, 0, 0, 0)
      const threeDaysFromNow = new Date(today)
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      return (
        dueDate >= today &&
        dueDate <= threeDaysFromNow &&
        task.status !== "Completed On Time" &&
        task.status !== "Completed Overdue"
      )
    }).forEach(task => {
      const dueDate = new Date(task.deadline)
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      notificationsList.push({
        id: `deadline-${task.id}`,
        type: daysUntil <= 1 ? "High Priority" : "Low Priority",
        message: `Task "${task.name}" for ${task.assignedTo} is due in ${daysUntil} day(s)`,
        date: task.deadline,
        taskId: task.id,
        notificationDate: today
      })
    })

    // Sort notifications by priority and date
    notificationsList.sort((a, b) => {
      // First by priority
      if (a.type.includes("High") && !b.type.includes("High")) return -1
      if (!a.type.includes("High") && b.type.includes("High")) return 1
      
      // Then by date
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    setNotifications(notificationsList)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Handle view task
  const handleViewTask = (taskId: string) => {
    router.push(`/task?taskId=${taskId}&expand=true`)
  }

  // Navigate to different pages
  const navigateToUsers = () => {
    router.push("/receiver")
  }

  // Navigate to task page with filter for verifying tasks
  const navigateToVerifyingTasks = () => {
    // Navigate to task page with filter set to "Verifying"
    router.push("/task?filter=Verifying")
  }

  return (
    <div className="flex-1 bg-gray-100">
      <div className="grid grid-cols-[1fr_280px] h-screen">
        {/* Main dashboard content */}
        <div className="p-8 overflow-y-auto">
          {/* Dashboard header */}
          <div className="mb-6">
            <h1 className="mb-2">
              <span className="text-5xl font-bold">Dashboard</span>{" "}
              <span className="text-3xl text-red-800 font-bold">Admin</span>
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332]"></div>
            </div>
          ) : (
            <div>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Total Tasks */}
                <div className="bg-[#8B2332] text-white p-6 rounded-md">
                  <div className="text-4xl font-bold">{stats.totalTasks}</div>
                  <div className="text-sm mt-2">Total Tasks</div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>Pending: {stats.pendingTasks}</span>
                    <span>Completed: {stats.completedTasks}</span>
                  </div>
                </div>

                {/* Users */}
                <div 
                  className="bg-[#8B2332] text-white p-6 rounded-md cursor-pointer hover:bg-[#7a1e2c] transition-colors"
                  onClick={navigateToUsers}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="text-4xl font-bold">{stats.totalUsers}</div>
                      <div className="text-sm mt-2">Total Users</div>
                    </div>
                    <Users className="h-12 w-12 opacity-70" />
                  </div>
                </div>

                {/* Tasks Pending Verification */}
                <div 
                  className="bg-[#8B2332] text-white p-6 rounded-md cursor-pointer hover:bg-[#7a1e2c] transition-colors"
                  onClick={navigateToVerifyingTasks}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="text-4xl font-bold">{stats.verifyingTasks}</div>
                      <div className="text-sm mt-2">Tasks Pending Verification</div>
                    </div>
                    <BarChart2 className="h-12 w-12 opacity-70" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tasks Waiting for Verification */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Tasks Waiting for Verification</h2>
                  {tasksVerifying.length > 0 ? (
                    <div className="space-y-4">
                      {tasksVerifying.map((task) => (
                        <div key={task.id} className="bg-[#8B2332] text-white p-4 rounded-md">
                          <div className="flex items-start gap-2 mb-2">
                            <Clock className="h-5 w-5 mt-0.5" />
                            <div>
                              <div className="font-medium">{task.name}</div>
                              <div className="text-sm">
                                Assigned to: {task.assignedTo}
                                <br />
                                Submitted for verification on: {task.completed ? formatDate(task.completed) : "Unknown"}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleViewTask(task.id)}
                              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Verify Task
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-md text-gray-500 text-center">No tasks waiting for verification</div>
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
                                Assigned to: {task.assignedTo}
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

              {/* Recent Tasks */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tasks Near Deadline */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Tasks Near Deadline</h2>
                  {tasksNearDeadline.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {tasksNearDeadline.map((task) => (
                        <div key={task.id} className="bg-white border p-4 rounded-md">
                          <div className="flex items-start gap-2 mb-2">
                            <Clock className="h-5 w-5 mt-0.5 text-orange-500" />
                            <div>
                              <div className="font-medium">{task.name}</div>
                              <div className="text-sm text-gray-600">
                                Assigned to: {task.assignedTo}
                                <br />
                                Deadline: {formatDate(task.deadline)}
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
                    <div className="bg-white p-4 rounded-md text-gray-500 text-center">No tasks near deadline</div>
                  )}
                </div>

                {/* Pending Tasks */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Recent Pending Tasks</h2>
                  {tasksPending.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {tasksPending.map((task) => (
                        <div key={task.id} className="bg-white border p-4 rounded-md">
                          <div className="flex items-start gap-2 mb-2">
                            <Clock className="h-5 w-5 mt-0.5 text-blue-500" />
                            <div>
                              <div className="font-medium">{task.name}</div>
                              <div className="text-sm text-gray-600">
                                Assigned to: {task.assignedTo}
                                <br />
                                Assigned on: {formatDate(task.assignedOn)}
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
                    <div className="bg-white p-4 rounded-md text-gray-500 text-center">No pending tasks</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications card */}
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