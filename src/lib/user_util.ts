import { Task, Notification } from "./utils";
import { taskData } from "./task-data";

// Replace this with your actual logic for obtaining the current user's doc_id.
const currentUserDocId = "doc1";

/**
 * Calculates task statistics for the current user.
 * Filters tasks based on the current user's doc_id.
 */
export function calculateStats() {
  // Filter tasks for the current user.
  const userTasks = taskData.tasks.filter((task: Task) => task.doc_id === currentUserDocId);
  const totalTasks = userTasks.length;

  const completedTasks = userTasks.filter((task: Task) => task.status === "Completed").length;
  const overdueTasks = userTasks.filter((task: Task) => task.status === "Overdue").length;

  const tasksPerformedOnTime = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const tasksPerformedOverdue = totalTasks ? Math.round((overdueTasks / totalTasks) * 100) : 0;

  return {
    tasksPerformedOnTime,
    tasksPerformedOverdue,
    totalTasks,
  };
}

/**
 * Returns an array of tasks near their deadline for the current user.
 * Only non-completed and non-overdue tasks are considered.
 */
export function getTasksNearDeadline(): Task[] {
  const userTasks = taskData.tasks.filter((task: Task) => 
    task.doc_id === currentUserDocId &&
    task.status !== "Completed" &&
    task.status !== "Overdue"
  );

  // Sort tasks by due date (closest first)
  const sortedByDueDate = userTasks.sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Return the first 3 tasks with the closest deadlines
  return sortedByDueDate.slice(0, 3);
}

/**
 * Returns an array of overdue tasks for the current user.
 */
export function getOverdueTasks(): Task[] {
  return taskData.tasks.filter((task: Task) => 
    task.doc_id === currentUserDocId && task.status === "Overdue"
  );
}

/**
 * Formats a date string or Date object into a locale date string.
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString();
}

/**
 * Generates notifications for the current user.
 * It filters tasks by doc_id and creates notifications for pending tasks (based on priority)
 * as well as overdue tasks.
 *
 * @param limit - Maximum number of notifications to return (default is 5)
 */
export function generateNotifications(limit = 5): Notification[] {
  const userTasks = taskData.tasks.filter((task: Task) => task.doc_id === currentUserDocId);
  const notifications: Notification[] = [];

  userTasks.forEach(task => {
    const dueDate = new Date(task.dueDate);
    const isPending = task.status === "Pending";

    // Generate notifications based on priority for pending tasks
    if (task.priority === "High" && isPending) {
      notifications.push({
        id: task.id,
        type: "High Priority Task",
        message: `Task #${task.id} needs immediate attention`,
        priority: 1,
        date: dueDate,
      });
    } else if (task.priority === "Medium" && isPending) {
      notifications.push({
        id: task.id,
        type: "Medium Priority Task",
        message: `Task #${task.id} needs attention`,
        priority: 3,
        date: dueDate,
      });
    } else if (task.priority === "Low" && isPending) {
      notifications.push({
        id: task.id,
        type: "Low Priority Task",
        message: `Task #${task.id} needs review`,
        priority: 5,
        date: dueDate,
      });
    }

    // Generate notifications for overdue tasks
    if (task.status === "Overdue") {
      notifications.push({
        id: task.id,
        type: "Overdue Task",
        message: `Task #${task.id} is overdue`,
        priority: 2,
        date: dueDate,
      });
    }
  });

  // Sort notifications by priority (lower number = higher priority)
  // and then by date (latest first), then limit the output.
  return notifications
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, limit);
}
