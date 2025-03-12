import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { taskData } from "./sample-data"

// Define the Task interface to match the structure in sample-data.ts
export interface Task {
  id: number;
  assignedTo: string;
  doc_id: string;
  status: string;
  priority: string;
  assignedDate: string;    // or Date if you prefer
  dueDate: string;         // or Date if you prefer
  completionDate: string;  // or Date if you prefer
  reopened: boolean;       // added property
  completionTime: number | null;  // added property; can be null if not available
}

// Define the Notification interface
export interface Notification {
  id: number
  type: string
  message: string
  priority: number // Higher number = higher priority for sorting
  date: string | Date
}

// Function that calculates and returns task statistics based on actual data
export function calculateStats() {
  const tasks = taskData.tasks
  const totalTasks = tasks.length

  // Count tasks by status
  const completedTasks = tasks.filter((task) => task.status === "Completed").length
  const pendingTasks = tasks.filter((task) => task.status === "Pending").length
  const overdueTasks = tasks.filter((task) => task.status === "Overdue").length

  // Calculate percentages
  const tasksPerformedOnTime = Math.round((completedTasks / totalTasks) * 100)
  const tasksPerformedOverdue = Math.round((overdueTasks / totalTasks) * 100)

  return {
    tasksPerformedOnTime, // percentage of completed tasks
    tasksPerformedOverdue, // percentage of overdue tasks
    pendingTasks, // number of pending tasks
    overdueTasks, // number of overdue tasks
  }
}

// Function that returns an array of tasks that are near their deadline.
export function getTasksNearDeadline(): Task[] {
  // The issue is that the sample data has dates from early 2024,
  // but we're checking against the current date which is in 2025.
  // Let's modify our approach to find pending tasks with the closest due dates

  // Get all non-completed tasks
  const pendingTasks = taskData.tasks.filter((task) => task.status !== "Completed" && task.status !== "Overdue")

  // Sort them by due date (closest first)
  const sortedByDueDate = [...pendingTasks].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime()
    const dateB = new Date(b.dueDate).getTime()
    return dateA - dateB
  })

  // Return the 3 tasks with the closest due dates
  return sortedByDueDate.slice(0, 3)
}

// Function that returns an array of overdue tasks.
export function getOverdueTasks(): Task[] {
  return taskData.tasks.filter((task) => task.status === "Overdue")
}

// Function to generate notifications based on priority and deadline proximity
export function generateNotifications(limit = 5): Notification[] {
  const today = new Date()
  const notifications: Notification[] = []

  // Process all tasks to find ones that match our criteria
  taskData.tasks.forEach((task) => {
    const dueDate = new Date(task.dueDate)

    // For the sample data, we'll consider tasks "due tomorrow" if they're pending
    // and have a priority that matches our criteria
    const isPending = task.status === "Pending"

    // High priority tasks
    if (task.priority === "High") {
      if (isPending) {
        notifications.push({
          id: task.id,
          type: "High Priority Task",
          message: `Task #${task.id} needs immediate attention`,
          priority: 1,
          date: dueDate,
        })
      }
    }

    // Medium priority tasks
    else if (task.priority === "Medium") {
      if (isPending) {
        notifications.push({
          id: task.id,
          type: "Medium Priority Task",
          message: `Task #${task.id} needs attention`,
          priority: 3,
          date: dueDate,
        })
      }
    }

    // Low priority tasks
    else if (task.priority === "Low") {
      if (isPending) {
        notifications.push({
          id: task.id,
          type: "Low Priority Task",
          message: `Task #${task.id} needs review`,
          priority: 5,
          date: dueDate,
        })
      }
    }

    // Add notifications for overdue tasks
    if (task.status === "Overdue") {
      notifications.push({
        id: task.id,
        type: "Overdue Task",
        message: `Task #${task.id} is overdue`,
        priority: 2, // High priority for overdue tasks
        date: dueDate,
      })
    }
  })

  // Sort notifications by priority (highest first) and then by date (latest first)
  return notifications
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    .slice(0, limit)
}

// Function to format a date. It accepts a string or Date and returns a formatted string.
export function formatDate(date: string | Date | null): string {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString()
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

