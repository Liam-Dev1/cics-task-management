"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, Upload, Plus, Save, X, CheckCircle, RefreshCw, Calendar, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { auth, db, storage } from "@/lib/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useSearchParams } from "next/navigation"
import RecurringTaskModal, { type RecurringSettings } from "./recurring-task-modal"

// File object interface
interface FileObject extends File {
  name: string
  size: number
  type: string
}

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
  // Recurring task properties
  isRecurring?: boolean
  recurrencePattern?: "daily" | "weekly" | "biweekly" | "monthly" | "custom"
  recurrenceInterval?: number
  recurrenceEndDate?: string
  recurrenceCount?: number
  recurrenceEndType?: "never" | "after" | "on"
  parentTaskId?: string
  childTaskIds?: string[]
  nextDeadlines?: string[]
}

// User interface
interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function TaskManagement() {
  const [showNewTask, setShowNewTask] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingTaskOriginal, setEditingTaskOriginal] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [file, setFile] = useState<FileObject | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const newTaskFileInputRef = useRef<HTMLInputElement>(null)
  const [user] = useAuthState(auth)
  const [userName, setUserName] = useState<string>("Admin User")
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  })
  const [users, setUsers] = useState<User[]>([])

  // Recurring task state
  const [isRecurringTask, setIsRecurringTask] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [currentRecurringTask, setCurrentRecurringTask] = useState<string | null>(null)
  const [recurringSettings, setRecurringSettings] = useState<RecurringSettings>({
    isRecurring: true,
    recurrencePattern: "weekly",
    recurrenceInterval: 1,
    recurrenceEndType: "never",
    recurrenceCount: 10,
    recurrenceEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextDeadlines: [],
  })

  type SortValue = string | null
  const [activeSort, setActiveSort] = useState<SortValue>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  const searchParams = useSearchParams()
  const taskIdFromUrl = searchParams.get("taskId")

  // Show notification
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ message: "", type: null })
    }, 3000)
  }

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
          }
        } catch (error) {
          console.error("Error fetching user name:", error)
        }
      }
    }

    fetchUserName()
  }, [user])

  // Fetch users with role "user" from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("role", "==", "user"))
        const querySnapshot = await getDocs(q)

        const fetchedUsers: User[] = []
        querySnapshot.forEach((doc) => {
          fetchedUsers.push({
            id: doc.id,
            ...(doc.data() as Omit<User, "id">),
          })
        })

        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [])

  // Fetch tasks from Firestore
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const tasksCollection = collection(db, "tasks")
        const tasksQuery = query(tasksCollection, orderBy("assignedOn", "desc"))
        const querySnapshot = await getDocs(tasksQuery)

        const fetchedTasks: Task[] = []
        querySnapshot.forEach((doc) => {
          fetchedTasks.push({
            id: doc.id,
            ...(doc.data() as Omit<Task, "id">),
          })
        })

        setTasks(fetchedTasks)

        // Initialize expanded state for all tasks
        const initialExpandedState: Record<string, boolean> = {}
        fetchedTasks.forEach((task) => {
          initialExpandedState[task.id] = true
        })
        setExpandedTasks(initialExpandedState)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        showNotification("Failed to load tasks. Please try again.", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  // Check for tasks that need to be duplicated (recurring tasks that have reached their deadline)
  useEffect(() => {
    const checkRecurringTasks = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const recurringTasks = tasks.filter(
        (task) =>
          task.isRecurring &&
          task.status !== "Completed On Time" &&
          task.status !== "Completed Overdue" &&
          task.nextDeadlines &&
          task.nextDeadlines.length > 0,
      )

      for (const task of recurringTasks) {
        // Check if any of the next deadlines have passed
        const passedDeadlines =
          task.nextDeadlines?.filter((deadline) => {
            const deadlineDate = new Date(deadline)
            deadlineDate.setHours(0, 0, 0, 0)
            return deadlineDate <= today
          }) || []

        if (passedDeadlines.length > 0) {
          // Create a new task for each passed deadline
          for (const deadline of passedDeadlines) {
            await createRecurringTaskInstance(task, deadline)
          }

          // Update the original task to remove the used deadlines
          const remainingDeadlines = task.nextDeadlines?.filter((deadline) => !passedDeadlines.includes(deadline)) || []

          const taskRef = doc(db, "tasks", task.id)
          await updateDoc(taskRef, {
            nextDeadlines: remainingDeadlines,
          })

          // Update local state
          setTasks((prevTasks) =>
            prevTasks.map((t) => (t.id === task.id ? { ...t, nextDeadlines: remainingDeadlines } : t)),
          )
        }
      }
    }

    if (tasks.length > 0) {
      checkRecurringTasks()
    }
  }, [tasks])

  // Create a new instance of a recurring task
  const createRecurringTaskInstance = async (parentTask: Task, deadline: string) => {
    try {
      // Create a new task based on the parent task
      const newTaskData = {
        name: parentTask.name,
        assignedBy: parentTask.assignedBy,
        assignedTo: parentTask.assignedTo,
        assignedToEmail: parentTask.assignedToEmail,
        assignedToId: parentTask.assignedToId,
        assignedOn: new Date().toISOString().split("T")[0],
        deadline: deadline,
        status: "Pending",
        priority: parentTask.priority,
        description: parentTask.description,
        files: parentTask.files || [],
        isRecurring: false, // Child tasks are not recurring themselves
        parentTaskId: parentTask.id,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "tasks"), newTaskData)

      // Update the parent task's childTaskIds array
      const parentTaskRef = doc(db, "tasks", parentTask.id)
      await updateDoc(parentTaskRef, {
        childTaskIds: [...(parentTask.childTaskIds || []), docRef.id],
      })

      // Update local state
      const newTask = {
        ...newTaskData,
        id: docRef.id,
        assignedOn: new Date().toISOString().split("T")[0], // Convert Timestamp to string
      }

      setTasks((prevTasks) => [
        newTask as Task,
        ...prevTasks.map((t) =>
          t.id === parentTask.id ? { ...t, childTaskIds: [...(t.childTaskIds || []), docRef.id] } : t,
        ),
      ])

      showNotification("Recurring task instance created", "success")
    } catch (error) {
      console.error("Error creating recurring task instance:", error)
      showNotification("Failed to create recurring task instance", "error")
    }
  }

  // Scroll to specific task if ID is provided in URL
  useEffect(() => {
    if (taskIdFromUrl && tasks.length > 0) {
      // Make sure the task exists
      const taskExists = tasks.some((task) => task.id === taskIdFromUrl)

      if (taskExists) {
        // Scroll to the task with a slight delay to ensure rendering is complete
        setTimeout(() => {
          const taskElement = document.getElementById(`task-${taskIdFromUrl}`)
          if (taskElement) {
            // Scroll to the task
            taskElement.scrollIntoView({ behavior: "smooth", block: "center" })

            // Highlight the task briefly to make it more noticeable
            taskElement.classList.add("ring-2", "ring-[#8B2332]", "ring-opacity-70")
            setTimeout(() => {
              taskElement.classList.remove("ring-2", "ring-[#8B2332]", "ring-opacity-70")
            }, 2000)
          }
        }, 300)
      }
    }
  }, [taskIdFromUrl, tasks])

  // Filter tasks based on search query and active filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      !activeFilter ||
      (["Pending", "Verifying", "Completed On Time", "Completed Overdue", "Reopened"].includes(activeFilter) &&
        task.status === activeFilter) ||
      (["High", "Medium", "Low"].includes(activeFilter) && task.priority === activeFilter) ||
      (activeFilter === "Recurring" && task.isRecurring)
    return matchesSearch && matchesFilter
  })

  // Sort tasks based on active sort option
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (activeSort) {
      case "nameAsc":
        return a.name.localeCompare(b.name)
      case "nameDesc":
        return b.name.localeCompare(a.name)
      case "receiverAsc":
        return a.assignedTo.localeCompare(b.assignedTo)
      case "receiverDesc":
        return b.assignedTo.localeCompare(a.assignedTo)
      case "assignedAsc":
        return new Date(a.assignedOn).getTime() - new Date(b.assignedOn).getTime()
      case "assignedDesc":
        return new Date(b.assignedOn).getTime() - new Date(a.assignedOn).getTime()
      case "deadlineAsc":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      case "deadlineDesc":
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
      default:
        return 0
    }
  })

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  // Input change handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    taskId: string | null = null,
  ) => {
    const { name, value } = e.target
    if (taskId !== null) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [name]: value } : task)))
    }
  }

  const handleSelectChange = (name: string, value: string, taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [name]: value } : task)))
  }

  const handleNewTaskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if ("name" in selectedFile) {
        setFile(selectedFile as FileObject)
      }
    }
  }

  // Handle file change for existing tasks
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !uploadingTaskId) {
      return
    }

    try {
      setUploadingFile(true)
      const selectedFile = e.target.files[0]

      // Upload file to Firebase Storage
      const fileUrl = await uploadFileToStorage(selectedFile, uploadingTaskId)

      // Get the current task
      const taskToUpdate = tasks.find((task) => task.id === uploadingTaskId)
      if (!taskToUpdate) return

      // Prepare the updated files array
      const updatedFiles = [...(taskToUpdate.files || []), { name: selectedFile.name, url: fileUrl }]

      // Update the task in Firestore
      const taskRef = doc(db, "tasks", uploadingTaskId)
      await updateDoc(taskRef, {
        files: updatedFiles,
      })

      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === uploadingTaskId
            ? {
                ...task,
                files: updatedFiles,
              }
            : task,
        ),
      )

      showNotification("File attached successfully", "success")
    } catch (error) {
      console.error("Error attaching file:", error)
      showNotification("Failed to attach file. Please try again.", "error")
    } finally {
      setUploadingFile(false)
      setUploadingTaskId(null)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Upload file to Firebase Storage
  const uploadFileToStorage = async (file: File, taskId: string): Promise<string> => {
    const fileRef = ref(storage, `tasks/${taskId}/${file.name}`)
    await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(fileRef)
    return downloadURL
  }

  // Task management functions
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setUploadingFile(true)
      const form = e.currentTarget
      const formData = new FormData(form)

      // Get the selected user from the form
      const assignedToName = formData.get("assignedTo") as string
      const assignedToUser = users.find((user) => user.name === assignedToName)

      if (!assignedToUser) {
        showNotification("Selected user not found.", "error")
        return
      }

      // Create new task document in Firestore
      const newTaskData: Partial<Task> = {
        name: (formData.get("name") as string) || "",
        assignedBy: userName,
        assignedTo: assignedToUser.name,
        assignedToEmail: assignedToUser.email,
        assignedToId: assignedToUser.id,
        assignedOn: new Date().toISOString().split("T")[0],
        deadline: (formData.get("deadline") as string) || "",
        status: (formData.get("status") as string) || "Pending",
        priority: (formData.get("priority") as string) || "Medium",
        description: (formData.get("description") as string) || "",
        files: [],
        isRecurring: isRecurringTask,
      }

      // Add recurring task properties if applicable
      if (isRecurringTask) {
        newTaskData.recurrencePattern = recurringSettings.recurrencePattern
        newTaskData.recurrenceInterval = recurringSettings.recurrenceInterval
        newTaskData.recurrenceEndType = recurringSettings.recurrenceEndType
        newTaskData.recurrenceCount = recurringSettings.recurrenceCount
        newTaskData.recurrenceEndDate = recurringSettings.recurrenceEndDate
        newTaskData.nextDeadlines = recurringSettings.nextDeadlines
        newTaskData.childTaskIds = []
      }

      const docRef = await addDoc(collection(db, "tasks"), newTaskData)

      // If there's a file, upload it to Firebase Storage
      if (file) {
        const fileUrl = await uploadFileToStorage(file, docRef.id)

        // Update the task document with the file information
        await updateDoc(doc(db, "tasks", docRef.id), {
          files: [
            {
              name: file.name,
              url: fileUrl,
            },
          ],
        })

        // Update local state
        const newTask: Task = {
          ...(newTaskData as Task),
          id: docRef.id,
          files: [
            {
              name: file.name,
              url: fileUrl,
            },
          ],
        }

        setTasks((prev) => [newTask, ...prev])
      } else {
        // Update local state without files
        const newTask: Task = {
          ...(newTaskData as Task),
          id: docRef.id,
        }

        setTasks((prev) => [newTask, ...prev])
      }

      // Reset form
      setFile(null)
      setShowNewTask(false)
      setIsRecurringTask(false)
      setRecurringSettings({
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndType: "never",
        recurrenceCount: 10,
        recurrenceEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        nextDeadlines: [],
      })
      form.reset()

      showNotification("Task created successfully", "success")
    } catch (error) {
      console.error("Error adding task:", error)
      showNotification("Failed to create task. Please try again.", "error")
    } finally {
      setUploadingFile(false)
    }
  }

  const handleEditTask = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.id === taskId)
    if (!taskToEdit) return

    setEditingTask(taskId)
    setEditingTaskOriginal({ ...taskToEdit })

    // If it's a recurring task, set up the recurring settings
    if (taskToEdit.isRecurring) {
      setRecurringSettings({
        isRecurring: true,
        recurrencePattern: taskToEdit.recurrencePattern || "weekly",
        recurrenceInterval: taskToEdit.recurrenceInterval || 1,
        recurrenceEndType: taskToEdit.recurrenceEndType || "never",
        recurrenceCount: taskToEdit.recurrenceCount || 10,
        recurrenceEndDate:
          taskToEdit.recurrenceEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        nextDeadlines: taskToEdit.nextDeadlines || [],
      })
    }
  }

  const handleSaveEdit = async (taskId: string) => {
    try {
      const taskToUpdate = tasks.find((task) => task.id === taskId)
      if (!taskToUpdate) return

      // Update the task in Firestore
      const taskRef = doc(db, "tasks", taskId)
      await updateDoc(taskRef, {
        name: taskToUpdate.name,
        assignedTo: taskToUpdate.assignedTo,
        assignedToEmail: taskToUpdate.assignedToEmail,
        assignedToId: taskToUpdate.assignedToId,
        deadline: taskToUpdate.deadline,
        status: taskToUpdate.status,
        priority: taskToUpdate.priority,
        description: taskToUpdate.description,
        isRecurring: taskToUpdate.isRecurring,
        recurrencePattern: taskToUpdate.recurrencePattern,
        recurrenceInterval: taskToUpdate.recurrenceInterval,
        recurrenceEndType: taskToUpdate.recurrenceEndType,
        recurrenceCount: taskToUpdate.recurrenceCount,
        recurrenceEndDate: taskToUpdate.recurrenceEndDate,
        nextDeadlines: taskToUpdate.nextDeadlines,
      })

      showNotification("Task updated successfully", "success")
    } catch (error) {
      console.error("Error updating task:", error)
      showNotification("Failed to update task. Please try again.", "error")

      // Revert to original if there's an error
      if (editingTaskOriginal) {
        setTasks((prev) => prev.map((task) => (task.id === editingTaskOriginal.id ? editingTaskOriginal : task)))
      }
    } finally {
      setEditingTask(null)
      setEditingTaskOriginal(null)
    }
  }

  const handleCancelEdit = () => {
    if (editingTaskOriginal) {
      setTasks((prev) => prev.map((task) => (task.id === editingTaskOriginal.id ? editingTaskOriginal : task)))
    }
    setEditingTask(null)
    setEditingTaskOriginal(null)
  }

  // Update the handleVerifyCompletion function to determine if the task is completed on time or overdue
  const handleVerifyCompletion = async (taskId: string) => {
    try {
      // Get the current task
      const taskToUpdate = tasks.find((task) => task.id === taskId)
      if (!taskToUpdate) return

      // Update the task in Firestore
      const taskRef = doc(db, "tasks", taskId)
      const completedDate = new Date().toISOString().split("T")[0]

      // Determine if the task is completed on time or overdue
      const deadlineDate = new Date(taskToUpdate.deadline)
      const completionDate = taskToUpdate.completed ? new Date(taskToUpdate.completed) : new Date()

      // Set the appropriate status based on deadline comparison
      const newStatus = completionDate <= deadlineDate ? "Completed On Time" : "Completed Overdue"

      await updateDoc(taskRef, {
        status: newStatus,
        completed: taskToUpdate.completed || completedDate,
      })

      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: newStatus,
                completed: task.completed || completedDate,
              }
            : task,
        ),
      )

      showNotification(`Task marked as ${newStatus}`, "success")
    } catch (error) {
      console.error("Error verifying task completion:", error)
      showNotification("Failed to update task status. Please try again.", "error")
    }
  }

  // Update the handleReopenTask function to work with both completion statuses
  const handleReopenTask = async (taskId: string) => {
    try {
      // Update the task in Firestore
      const taskRef = doc(db, "tasks", taskId)

      await updateDoc(taskRef, {
        status: "Reopened",
        completed: null,
      })

      // Update local state
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: "Reopened", completed: null } : task)),
      )

      showNotification("Task reopened", "success")
    } catch (error) {
      console.error("Error reopening task:", error)
      showNotification("Failed to reopen task. Please try again.", "error")
    }
  }

  const handleAttachFile = (taskId: string) => {
    setUploadingTaskId(taskId)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle recurring task settings
  const handleRecurringToggle = (value: boolean) => {
    setIsRecurringTask(value)
  }

  const openRecurringModal = (taskId: string | null = null) => {
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId)
      if (task) {
        setRecurringSettings({
          isRecurring: task.isRecurring || false,
          recurrencePattern: task.recurrencePattern || "weekly",
          recurrenceInterval: task.recurrenceInterval || 1,
          recurrenceEndType: task.recurrenceEndType || "never",
          recurrenceCount: task.recurrenceCount || 10,
          recurrenceEndDate:
            task.recurrenceEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          nextDeadlines: task.nextDeadlines || [],
        })
      }
    }
    setCurrentRecurringTask(taskId)
    setShowRecurringModal(true)
  }

  const handleSaveRecurringSettings = async (settings: RecurringSettings) => {
    if (currentRecurringTask) {
      // Update existing task
      try {
        const taskRef = doc(db, "tasks", currentRecurringTask)
        await updateDoc(taskRef, {
          isRecurring: true,
          recurrencePattern: settings.recurrencePattern,
          recurrenceInterval: settings.recurrenceInterval,
          recurrenceEndType: settings.recurrenceEndType,
          recurrenceCount: settings.recurrenceCount,
          recurrenceEndDate: settings.recurrenceEndDate,
          nextDeadlines: settings.nextDeadlines,
        })

        // Update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === currentRecurringTask
              ? {
                  ...task,
                  isRecurring: true,
                  recurrencePattern: settings.recurrencePattern,
                  recurrenceInterval: settings.recurrenceInterval,
                  recurrenceEndType: settings.recurrenceEndType,
                  recurrenceCount: settings.recurrenceCount,
                  recurrenceEndDate: settings.recurrenceEndDate,
                  nextDeadlines: settings.nextDeadlines,
                }
              : task,
          ),
        )

        showNotification("Recurring task settings updated", "success")
      } catch (error) {
        console.error("Error updating recurring task settings:", error)
        showNotification("Failed to update recurring task settings", "error")
      }
    } else {
      // For new task
      setRecurringSettings(settings)
    }
    setCurrentRecurringTask(null)
  }

  // Calculate next deadline based on recurrence pattern
  const calculateNextDeadline = (task: Task): string | null => {
    if (!task.isRecurring || !task.recurrencePattern || !task.deadline) return null

    const lastDeadline = new Date(task.deadline)
    const nextDeadline = new Date(lastDeadline)

    switch (task.recurrencePattern) {
      case "daily":
        nextDeadline.setDate(lastDeadline.getDate() + (task.recurrenceInterval || 1))
        break
      case "weekly":
        nextDeadline.setDate(lastDeadline.getDate() + 7 * (task.recurrenceInterval || 1))
        break
      case "biweekly":
        nextDeadline.setDate(lastDeadline.getDate() + 14 * (task.recurrenceInterval || 1))
        break
      case "monthly":
        nextDeadline.setMonth(lastDeadline.getMonth() + (task.recurrenceInterval || 1))
        break
      default:
        return null
    }

    return nextDeadline.toISOString().split("T")[0]
  }

  // Add another deadline to a recurring task
  const handleAddAnotherDeadline = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      // For custom recurrence, open the modal to let the admin choose
      if (task.recurrencePattern === "custom") {
        openRecurringModal(taskId)
        return
      }

      // Calculate the next deadline based on the recurrence pattern
      const nextDeadline = calculateNextDeadline(task)
      if (!nextDeadline) {
        showNotification("Could not calculate next deadline", "error")
        return
      }

      // Add the new deadline to the nextDeadlines array
      const updatedDeadlines = [...(task.nextDeadlines || []), nextDeadline].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      )

      // Update the task in Firestore
      const taskRef = doc(db, "tasks", taskId)
      await updateDoc(taskRef, {
        nextDeadlines: updatedDeadlines,
      })

      // Update local state
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, nextDeadlines: updatedDeadlines } : t)))

      showNotification("Added another deadline to recurring task", "success")
    } catch (error) {
      console.error("Error adding another deadline:", error)
      showNotification("Failed to add another deadline", "error")
    }
  }

  return (
    <div className="flex-1 bg-white">
      <div className="p-6">
        {/* Notification */}
        {notification.type && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded shadow-md ${
              notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}

        <h1 className="mb-6">
          <span className="text-5xl font-bold">Tasks</span>{" "}
          <span className="text-3xl text-red-800 font-bold">Admin</span>
        </h1>

        {/* Hidden file input for existing tasks */}
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search Tasks"
              className="pl-8 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Receiver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Receivers</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.name}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className={activeFilter ? "bg-red-100" : ""}>
                Filters
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuCheckboxItem checked={activeFilter === null} onCheckedChange={() => setActiveFilter(null)}>
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Pending"}
                onCheckedChange={() => setActiveFilter(activeFilter === "Pending" ? null : "Pending")}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Verifying"}
                onCheckedChange={() => setActiveFilter(activeFilter === "Verifying" ? null : "Verifying")}
              >
                Verifying
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Completed On Time"}
                onCheckedChange={() =>
                  setActiveFilter(activeFilter === "Completed On Time" ? null : "Completed On Time")
                }
              >
                Completed On Time
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Completed Overdue"}
                onCheckedChange={() =>
                  setActiveFilter(activeFilter === "Completed Overdue" ? null : "Completed Overdue")
                }
              >
                Completed Overdue
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Reopened"}
                onCheckedChange={() => setActiveFilter(activeFilter === "Reopened" ? null : "Reopened")}
              >
                Reopened
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Recurring"}
                onCheckedChange={() => setActiveFilter(activeFilter === "Recurring" ? null : "Recurring")}
              >
                Recurring Tasks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "High"}
                onCheckedChange={() => setActiveFilter(activeFilter === "High" ? null : "High")}
              >
                High Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Medium"}
                onCheckedChange={() => setActiveFilter(activeFilter === "Medium" ? null : "Medium")}
              >
                Medium Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "Low"}
                onCheckedChange={() => setActiveFilter(activeFilter === "Low" ? null : "Low")}
              >
                Low Priority
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className={activeSort ? "bg-red-100" : ""}>
                Sort
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuRadioGroup value={activeSort ?? ""} onValueChange={setActiveSort}>
                <DropdownMenuRadioItem value="">Default</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="nameAsc">Task Name (A-Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="nameDesc">Task Name (Z-A)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="receiverAsc">Task Receiver (A-Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="receiverDesc">Task Receiver (Z-A)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="assignedAsc">Date Assigned (Oldest First)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="assignedDesc">Date Assigned (Newest First)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="deadlineAsc">Deadline (Earliest First)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="deadlineDesc">Deadline (Latest First)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>Generate Reports</Button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-4 font-semibold mb-2 hidden md:grid">
            <div>Task Name</div>
            <div>Assigned by</div>
            <div>Assigned to</div>
            <div>Assigned on</div>
            <div>Deadline</div>
            <div>Status</div>
            <div>Priority</div>
          </div>

          {/* Add New Task Button */}
          <Button
            onClick={() => setShowNewTask(true)}
            className="bg-red-800 hover:bg-red-900 text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Task
          </Button>

          {/* New Task Form */}
          {showNewTask && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div className="grid md:grid-cols-7 gap-4">
                    <div className="md:col-span-1">
                      <label htmlFor="task-name" className="block text-sm font-medium mb-1">
                        Task Name
                      </label>
                      <Input id="task-name" placeholder="Insert Task Name Here" name="name" required />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium mb-1">Assigned By</label>
                      <div className="h-10 px-3 py-2 border rounded-md bg-gray-50">{userName}</div>
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor="assigned-to" className="block text-sm font-medium mb-1">
                        Assigned To
                      </label>
                      <Select name="assignedTo" required>
                        <SelectTrigger id="assigned-to">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.name}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium mb-1">Assigned On</label>
                      <div className="h-10 px-3 py-2 border rounded-md bg-gray-50">
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor="deadline" className="block text-sm font-medium mb-1">
                        Deadline
                      </label>
                      <Input id="deadline" type="date" name="deadline" required />
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor="status" className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <Select name="status" required>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Verifying">Verifying</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor="priority" className="block text-sm font-medium mb-1">
                        Priority
                      </label>
                      <Select name="priority" required>
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      placeholder="Add Description Here"
                      className="mb-4"
                      name="description"
                      required
                    />
                  </div>

                  {/* Recurring Task Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch id="recurring-task" checked={isRecurringTask} onCheckedChange={handleRecurringToggle} />
                    <Label htmlFor="recurring-task">Make this a recurring task</Label>

                    {isRecurringTask && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openRecurringModal()}
                        className="ml-auto"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Configure Recurrence
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex gap-2"
                      onClick={() => newTaskFileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-800"></div>
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Attach Files
                    </Button>
                    <input
                      type="file"
                      ref={newTaskFileInputRef}
                      onChange={handleNewTaskFileChange}
                      className="hidden"
                    />
                    <div>
                      <Button type="button" variant="outline" className="mr-2" onClick={() => setShowNewTask(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploadingFile}>
                        {uploadingFile ? "Creating..." : "Assign Task"}
                      </Button>
                    </div>
                  </div>
                  {file && <p className="mt-2">File attached: {file.name}</p>}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-800"></div>
            </div>
          )}

          {/* Existing Tasks */}
          {!loading && sortedTasks.length > 0
            ? sortedTasks.map((task) => (
                <div key={task.id} id={`task-${task.id}`} className="bg-red-800 text-white p-4 rounded">
                  <div className="grid md:grid-cols-7 gap-4">
                    {editingTask === task.id ? (
                      <>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Task Name: </span>
                          <Input
                            name="name"
                            value={task.name}
                            onChange={(e) => handleInputChange(e, task.id)}
                            className="bg-white text-black"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Assigned By: </span>
                          <div>{task.assignedBy}</div>
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Assigned To: </span>
                          <Select
                            name="assignedTo"
                            value={task.assignedTo}
                            onValueChange={(value) => {
                              const selectedUser = users.find((user) => user.name === value)
                              if (selectedUser) {
                                handleSelectChange("assignedTo", selectedUser.name, task.id)
                                handleSelectChange("assignedToEmail", selectedUser.email, task.id)
                                handleSelectChange("assignedToId", selectedUser.id, task.id)
                              }
                            }}
                          >
                            <SelectTrigger className="bg-white text-black">
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.name}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Assigned On: </span>
                          <div>{task.assignedOn}</div>
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Deadline: </span>
                          <Input
                            type="date"
                            name="deadline"
                            value={task.deadline}
                            onChange={(e) => handleInputChange(e, task.id)}
                            className="bg-white text-black"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Status: </span>
                          <Select
                            name="status"
                            value={task.status}
                            onValueChange={(value) => handleSelectChange("status", value, task.id)}
                          >
                            <SelectTrigger className="bg-white text-black">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Verifying">Verifying</SelectItem>
                              <SelectItem value="Completed On Time">Completed On Time</SelectItem>
                              <SelectItem value="Completed Overdue">Completed Overdue</SelectItem>
                              <SelectItem value="Reopened">Reopened</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Priority: </span>
                          <Select
                            name="priority"
                            value={task.priority}
                            onValueChange={(value) => handleSelectChange("priority", value, task.id)}
                          >
                            <SelectTrigger className="bg-white text-black">
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Task Name: </span>
                          <div className="flex items-center">
                            {task.name}
                            {task.isRecurring && (
                              <Badge className="ml-2 bg-blue-600">
                                <Repeat className="h-3 w-3 mr-1" />
                                Recurring
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Assigned By: </span>
                          {task.assignedBy}
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Assigned To: </span>
                          {task.assignedTo}
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Assigned On: </span>
                          {task.assignedOn}
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Deadline: </span>
                          {task.deadline}
                        </div>
                        <div className="md:col-span-1">
                          <span className="md:hidden font-semibold">Status: </span>
                          <Badge
                            className={
                              task.status === "Completed On Time"
                                ? "bg-green-600"
                                : task.status === "Completed Overdue"
                                  ? "bg-orange-600"
                                  : task.status === "Verifying"
                                    ? "bg-yellow-600"
                                    : task.status === "Reopened"
                                      ? "bg-purple-600"
                                      : "bg-blue-600"
                            }
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <div className="md:col-span-1 flex justify-between items-center">
                          <div>
                            <span className="md:hidden font-semibold">Priority: </span>
                            <Badge
                              className={
                                task.priority === "High"
                                  ? "bg-red-600"
                                  : task.priority === "Medium"
                                    ? "bg-orange-600"
                                    : "bg-green-600"
                              }
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="text-white hover:bg-red-700 rounded p-1"
                            aria-label={expandedTasks[task.id] ? "Collapse task details" : "Expand task details"}
                          >
                            {expandedTasks[task.id] ? <ChevronDown size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {expandedTasks[task.id] && (
                    <div className="bg-white text-black p-4 rounded mt-2">
                      {editingTask === task.id ? (
                        <>
                          <Textarea
                            placeholder="Add Description Here"
                            className="mt-2 mb-4"
                            name="description"
                            value={task.description}
                            onChange={(e) => handleInputChange(e, task.id)}
                          />

                          {/* Recurring Task Toggle in Edit Mode */}
                          <div className="flex items-center space-x-2 mb-4">
                            <Switch
                              id={`recurring-task-${task.id}`}
                              checked={task.isRecurring || false}
                              onCheckedChange={(checked: boolean) => {
                                setTasks((prev) =>
                                  prev.map((t) => (t.id === task.id ? { ...t, isRecurring: checked } : t)),
                                )
                              }}
                            />
                            <Label htmlFor={`recurring-task-${task.id}`}>Recurring task</Label>

                            {(task.isRecurring || false) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openRecurringModal(task.id)}
                                className="ml-auto"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Configure Recurrence
                              </Button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="my-2">{task.description}</p>

                          {/* Show upcoming deadlines for recurring tasks */}
                          {task.isRecurring && task.nextDeadlines && task.nextDeadlines.length > 0 && (
                            <div className="mt-4 mb-2">
                              <h4 className="font-medium text-sm mb-2">Upcoming Deadlines:</h4>
                              <div className="flex flex-wrap gap-2">
                                {task.nextDeadlines.map((deadline, index) => (
                                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(deadline).toLocaleDateString()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex flex-wrap justify-between mt-4">
                        <div className="space-x-2 mb-2">
                          {task.files &&
                            task.files.map((file, index) => (
                              <Button
                                key={index}
                                variant="secondary"
                                size="sm"
                                onClick={() => window.open(file.url, "_blank")}
                              >
                                {file.name}
                              </Button>
                            ))}
                        </div>
                        <div className="flex flex-row space-x-2">
                          {editingTask === task.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAttachFile(task.id)}
                                className="flex items-center gap-1"
                                disabled={uploadingFile}
                              >
                                {uploadingFile && uploadingTaskId === task.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-800"></div>
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                Attach Files
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveEdit(task.id)}
                                className="flex items-center gap-1"
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1"
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTask(task.id)}
                                className="flex items-center gap-1"
                              >
                                Edit Task
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyCompletion(task.id)}
                                disabled={task.status === "Completed On Time" || task.status === "Completed Overdue"}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Verify
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReopenTask(task.id)}
                                disabled={task.status !== "Completed On Time" && task.status !== "Completed Overdue"}
                                className="flex items-center gap-1"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Reopen
                              </Button>

                              {/* Add "Choose Another Deadline" button for recurring tasks */}
                              {task.isRecurring && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddAnotherDeadline(task.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Calendar className="h-4 w-4" />
                                  Choose Another Deadline
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            : !loading && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No tasks match your current filters</p>
                </div>
              )}
        </div>
      </div>

      {/* Recurring Task Modal */}
      <RecurringTaskModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        onSave={handleSaveRecurringSettings}
        initialSettings={recurringSettings}
      />
    </div>
  )
}

