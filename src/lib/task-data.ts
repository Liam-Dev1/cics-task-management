import { db } from "@/lib/firebase/firebase.config";
import { collection, getDocs, query, where } from "firebase/firestore";

// Define the task interface to match what the dashboard expects
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  assignedOn: string;
  deadline: string;
  completed?: string;
  status: string;
  priority: string;
  completionTime: number | null;  // Allow null values
  reopened: boolean;
}

export interface TaskDataType {
  tasks: Task[];
}

// Initial empty state
export let taskData: TaskDataType = {
  tasks: [],
};

// Function to fetch tasks from Firebase
export const fetchTaskData = async (): Promise<TaskDataType> => {
  try {
    const tasksCollection = collection(db, "tasks");
    const tasksSnapshot = await getDocs(tasksCollection);
    
    const tasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Calculate completionTime value
      const assignedDate = new Date(data.assignedOn).getTime();
      const deadlineDate = new Date(data.deadline).getTime();
      const completedDate = data.completed ? new Date(data.completed).getTime() : null;
      
      // Initialize completionTime as null (not 0)
      let completionTime = null;
      
      if (completedDate) {
        const msPerDay = 1000 * 60 * 60 * 24;
      
        const rawDaysUsed = Math.floor((completedDate - assignedDate) / msPerDay) + 1;
        const rawTotalDays = Math.floor((deadlineDate - assignedDate) / msPerDay) + 1;
      
        const daysUsed = Math.max(1, rawDaysUsed);
        const totalDays = Math.max(1, rawTotalDays);
      
        completionTime = Math.round((daysUsed / totalDays) * 100);
      }
      
      
      // Normalize status - convert both "Completed on Time" and "Completed Overdue" to "Completed"
      let status = data.status;
      if (status === "Completed On Time" || status === "Completed Overdue") {
        status = "Completed";
      }
      
      return {
        id: doc.id,
        title: data.title || "",
        description: data.description || "",
        assignedTo: data.assignedTo || "",
        assignedBy: data.assignedBy || "",
        assignedOn: data.assignedOn || "",
        deadline: data.deadline || "",
        completed: data.completed || null,
        status: status || "Pending",
        priority: data.priority || "Medium",
        completionTime, // null if not completed
        reopened: data.reopened || false,
      } as Task;
    });
    
    // Update the global taskData object
    taskData = { tasks };
    
    return taskData;
  } catch (error) {
    console.error("Error fetching task data:", error);
    return { tasks: [] };
  }
};