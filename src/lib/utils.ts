import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { taskData } from "./sample-data";

// Define strict types for better type safety
type TaskStatus = "Pending" | "Completed" | "Overdue";
type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  id: number;
  assignedTo: string;
  doc_id: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedDate: string;
  dueDate: string;
  completionDate: string | null;
  reopened: boolean;
  completionTime: number | null;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  priority: number;
  date: Date;
  read?: boolean;
}

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  overdueRate: number;
}

// Memoized calculation functions for better performance
const taskStatsCache = {
  value: null as TaskStats | null,
  lastUpdate: 0,
};

export function calculateStats(): TaskStats {
  const now = Date.now();
  
  // Return cached value if recent (5 minute cache)
  if (taskStatsCache.value && now - taskStatsCache.lastUpdate < 300000) {
    return taskStatsCache.value;
  }

  const tasks = taskData.tasks;
  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      overdueRate: 0,
    };
  }

  // Single pass through tasks for all counts
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  tasks.forEach((task) => {
    if (task.status === "Completed") completedTasks++;
    else if (task.status === "Pending") pendingTasks++;
    else if (task.status === "Overdue") overdueTasks++;
  });

  const stats = {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate: Math.round((completedTasks / totalTasks) * 100),
    overdueRate: Math.round((overdueTasks / totalTasks) * 100),
  };

  // Update cache
  taskStatsCache.value = stats;
  taskStatsCache.lastUpdate = now;

  return stats;
}

// Predefined priority values for type safety
const PRIORITY_VALUES: Record<TaskPriority, number> = {
  High: 2,
  Medium: 3,
  Low: 4,
};

const OVERDUE_PRIORITY = 1;
const URGENT_THRESHOLD = 1; // 1 day
const WARNING_THRESHOLD = 3; // 3 days

export function generateNotifications(limit = 5): Notification[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notifications: Notification[] = [];

  for (const task of taskData.tasks) {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const timeDiff = dueDate.getTime() - today.getTime();
    const daysUntilDue = timeDiff / (1000 * 3600 * 24);

    if (task.status === "Overdue") {
      notifications.push({
        id: task.id,
        type: "Overdue Task",
        message: `Task "${task.id}" is overdue`,
        priority: OVERDUE_PRIORITY,
        date: dueDate,
      });
      continue;
    }

    if (task.status === "Pending") {
      if (daysUntilDue <= URGENT_THRESHOLD && task.priority === "High") {
        notifications.push({
          id: task.id,
          type: "Urgent Task",
          message: `High priority task "${task.id}" is due soon`,
          priority: PRIORITY_VALUES.High,
          date: dueDate,
        });
      } else if (daysUntilDue <= WARNING_THRESHOLD) {
        notifications.push({
          id: task.id,
          type: "Upcoming Deadline",
          message: `Task "${task.id}" is due in ${Math.ceil(daysUntilDue)} days`,
          priority: PRIORITY_VALUES[task.priority as TaskPriority],
          date: dueDate,
        });
      }
    }
  }

  // Efficient sorting with early comparison return
  return notifications
    .sort((a, b) => a.priority - b.priority || a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

// Utility functions with proper typing
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  return date ? new Date(date).toLocaleDateString(undefined, options) : "N/A";
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}