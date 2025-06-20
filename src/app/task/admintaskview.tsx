"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, Upload, Plus, Save, X, CheckCircle, RefreshCw, Calendar } from "lucide-react"
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
import { auth, db, storage } from "@/lib/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useSearchParams } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type RecurringSettings = {
  isRecurring: boolean
  recurrencePattern: string
  recurrenceInterval: number
  recurrenceEndType: string
  recurrenceCount: number
  recurrenceEndDate: string
  nextDeadlines: string[]
}

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
  assignedTo: string // User's name for display
  assignedToEmail: string // User's email
  assignedToId: string // User's ID
  assignedToJobTitle?: string // User's job title
  assignedOn: string
  deadline: string
  status: string
  priority: string
  description: string
  completed?: string | null
  files?: Array<{ name: string; url: string }>
  isRecurring?: boolean
  recurrencePattern?: string
  recurrenceInterval?: number
  recurrenceEndType?: string
  recurrenceCount?: number
  recurrenceEndDate?: string
  nextDeadlines?: string[]
  childTaskIds?: string[]
}

// User interface
interface User {
  id: string
  name: string
  email: string
  role: string
  jobTitle?: string
}

export default function AdminTaskViewWrapper() {
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
  const [userRole, setUserRole] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  })
  const [users, setUsers] = useState<User[]>([])
  const [isRecurringTask, setIsRecurringTask] = useState(false)

  type SortValue = string | null
  const [activeSort, setActiveSort] = useState<SortValue>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Recurring task state
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [recurringSettings, setRecurringSettings] = useState<RecurringSettings>({
    isRecurring: true,
    recurrencePattern: "weekly",
    recurrenceInterval: 1,
    recurrenceEndType: "never",
    recurrenceCount: 10,
    recurrenceEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextDeadlines: [],
  })

  // Track which task's recurring settings we're editing
  const [editingRecurringTaskId, setEditingRecurringTaskId] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [tasksPerPage] = useState(10)

  // Check for filter from localStorage (set by the dashboard)
  useEffect(() => {
    const savedFilter = localStorage.getItem("activeTaskFilter")
    if (savedFilter) {
      setActiveFilter(savedFilter)
      // Clear the filter from localStorage after using it
      localStorage.removeItem("activeTaskFilter")
    }
  }, [])

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  const searchParams = useSearchParams()
  const taskIdFromUrl = searchParams.get("taskId")
  const expandFromUrl = searchParams.get("expand")

  // Show notification
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ message: "", type: null })
    }, 3000)
  }

  // Fetch user's name and role from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        try {
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("email", "==", user.email))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data()
            setUserName(userData.name || userData.displayName || user.displayName || "Admin User")
            setUserRole(userData.role || null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }

    fetchUserData()
  }, [user])

  // Fetch users with role "user" from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users")
        // Remove the role filter to get all users
        const querySnapshot = await getDocs(usersRef)

        const fetchedUsers: User[] = []
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as Omit<User, "id">
          // Add the user to the list if they exist
          if (userData.email) {
            fetchedUsers.push({
              id: doc.id,
              ...(userData as Omit<User, "id">),
            })
          }
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

        // Ensure all tasks have job titles by cross-referencing with users collection
        const usersCollection = collection(db, "users")
        const usersSnapshot = await getDocs(usersCollection)

        const usersMap = new Map()
        usersSnapshot.forEach((doc) => {
          const userData = doc.data()
          usersMap.set(doc.id, userData)
        })

        // Update tasks with job titles if missing
        const updatedTasks = fetchedTasks.map((task) => {
          if (!task.assignedToJobTitle && task.assignedToId && usersMap.has(task.assignedToId)) {
            const userData = usersMap.get(task.assignedToId)
            return {
              ...task,
              assignedToJobTitle: userData.jobTitle || "",
            }
          }
          return task
        })

        setTasks(updatedTasks)

        // Initialize expanded state for all tasks
        const initialExpandedState: Record<string, boolean> = {}
        updatedTasks.forEach((task) => {
          // If there's a taskId in the URL and expand=true, expand that task
          if (taskIdFromUrl && expandFromUrl === "true" && task.id === taskIdFromUrl) {
            initialExpandedState[task.id] = true
          } else {
            initialExpandedState[task.id] = false
          }
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
  }, [taskIdFromUrl, expandFromUrl])

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
            taskElement.classList.add("glow")
            setTimeout(() => {
              taskElement.classList.remove("glow")
            }, 2000)

            // If expand parameter is true, expand the task
            if (expandFromUrl === "true") {
              setExpandedTasks((prev) => ({
                ...prev,
                [taskIdFromUrl]: true,
              }))
            }
          }
        }, 300)
      }
    }
  }, [taskIdFromUrl, expandFromUrl, tasks])

  // Add a new state for the selected receiver filter
  const [selectedReceiver, setSelectedReceiver] = useState<string>("all")

  // Update the handleSelectChange function to handle receiver selection
  const handleReceiverChange = (value: string) => {
    setSelectedReceiver(value)
  }

  // Filter tasks based on search query and active filter
  const matchesFilter = (task: Task) =>
    !activeFilter ||
    (["Pending", "Verifying", "Completed On Time", "Completed Overdue", "Reopened"].includes(activeFilter) &&
      task.status === activeFilter) ||
    (["High", "Medium", "Low"].includes(activeFilter) && task.priority === activeFilter) ||
    (activeFilter === "Completed" && (task.status === "Completed On Time" || task.status === "Completed Overdue")) ||
    (activeFilter === "Overdue" &&
      ((new Date(task.deadline) < new Date() &&
        task.status !== "Completed On Time" &&
        task.status !== "Completed Overdue") ||
        task.status === "Completed Overdue"))

  // For admin users, only show tasks they've assigned or tasks assigned to them
  const matchesAdminView = (task: Task) => {
    // If user is a super admin, show all tasks
    if (userRole === "super admin") return true

    // For regular admin role, only show tasks they've assigned
    if (userRole === "admin") {
      return task.assignedBy === userName
    }

    // Default case
    return true
  }

  // Update the filteredTasks function to include filtering by receiver
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesReceiver = selectedReceiver === "all" || task.assignedTo === selectedReceiver
    return matchesSearch && matchesFilter(task) && matchesAdminView(task) && matchesReceiver
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

  // Pagination calculations
  const totalTasks = sortedTasks.length
  const totalPages = Math.ceil(totalTasks / tasksPerPage)
  const startIndex = (currentPage - 1) * tasksPerPage
  const endIndex = startIndex + tasksPerPage
  const currentTasks = sortedTasks.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter, selectedReceiver, activeSort])

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

  // Update the handleSelectChange function to also update the job title when changing assignee
  const handleSelectChange = (name: string, value: string, taskId: string) => {
    if (name === "assignedTo") {
      const selectedUser = users.find((user) => user.name === value)
      if (selectedUser) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  assignedTo: selectedUser.name,
                  assignedToEmail: selectedUser.email,
                  assignedToId: selectedUser.id,
                  assignedToJobTitle: selectedUser.jobTitle || "",
                }
              : task,
          ),
        )
      }
    } else {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [name]: value } : task)))
    }
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

  // Handle recurring task toggle for new tasks
  const handleRecurringToggle = (checked: boolean) => {
    setIsRecurringTask(checked)
  }

  // Handle recurring task toggle for existing tasks
  const handleEditRecurringToggle = (checked: boolean, taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isRecurring: checked,
            }
          : task,
      ),
    )
  }

  // Open recurring modal for a specific task
  const openRecurringModal = (taskId: string) => {
    alert("Recurring task configuration would open here")
  }

  // Save recurring settings for a specific task
  const handleSaveRecurringSettings = (settings: RecurringSettings) => {
    // Simple implementation for now
    setShowRecurringModal(false)
    setEditingRecurringTaskId(null)
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
      const newTaskData: any = {
        name: (formData.get("name") as string) || "",
        assignedBy: userName,
        assignedTo: assignedToUser.name, // User's name for display
        assignedToEmail: assignedToUser.email, // User's email
        assignedToId: assignedToUser.id, // User's ID
        assignedToJobTitle: assignedToUser.jobTitle || "", // User's job title
        assignedOn: new Date().toISOString().split("T")[0],
        deadline: (formData.get("deadline") as string) || "",
        status: (formData.get("status") as string) || "Pending",
        priority: (formData.get("priority") as string) || "Medium",
        description: (formData.get("description") as string) || "",
        files: [],
      }

      // Only add recurring task properties if it's a recurring task
      if (isRecurringTask) {
        newTaskData.isRecurring = true
        newTaskData.recurrencePattern = recurringSettings.recurrencePattern
        newTaskData.recurrenceInterval = recurringSettings.recurrenceInterval
        newTaskData.recurrenceEndType = recurringSettings.recurrenceEndType
        newTaskData.recurrenceCount = recurringSettings.recurrenceCount
        newTaskData.recurrenceEndDate = recurringSettings.recurrenceEndDate
        newTaskData.nextDeadlines = recurringSettings.nextDeadlines
        newTaskData.childTaskIds = []
      } else {
        newTaskData.isRecurring = false
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
          id: docRef.id,
          ...newTaskData,
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
          id: docRef.id,
          ...newTaskData,
        }

        setTasks((prev) => [newTask, ...prev])
      }

      // Reset form
      setFile(null)
      setShowNewTask(false)
      form.reset()
      setIsRecurringTask(false)

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

    // Set recurring task state based on the task being edited
    if (taskToEdit.isRecurring) {
      // Initialize recurring settings from the task
      const taskSettings: RecurringSettings = {
        isRecurring: taskToEdit.isRecurring || false,
        recurrencePattern: (taskToEdit.recurrencePattern as any) || "weekly",
        recurrenceInterval: taskToEdit.recurrenceInterval || 1,
        recurrenceEndType: (taskToEdit.recurrenceEndType as any) || "never",
        recurrenceCount: taskToEdit.recurrenceCount || 10,
        recurrenceEndDate:
          taskToEdit.recurrenceEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        nextDeadlines: taskToEdit.nextDeadlines || [],
      }
      setRecurringSettings(taskSettings)
    }
  }

  const handleSaveEdit = async (taskId: string) => {
    try {
      const taskToUpdate = tasks.find((task) => task.id === taskId)
      if (!taskToUpdate) return

      // Prepare update data including recurring task settings
      const updateData: Partial<Task> = {
        name: taskToUpdate.name,
        assignedTo: taskToUpdate.assignedTo,
        assignedToEmail: taskToUpdate.assignedToEmail,
        assignedToId: taskToUpdate.assignedToId,
        deadline: taskToUpdate.deadline,
        status: taskToUpdate.status,
        priority: taskToUpdate.priority,
        description: taskToUpdate.description,
        // Include recurring task properties
        isRecurring: taskToUpdate.isRecurring,
      }

      // Only include recurring properties if the task is recurring
      if (taskToUpdate.isRecurring) {
        updateData.recurrencePattern = taskToUpdate.recurrencePattern
        updateData.recurrenceInterval = taskToUpdate.recurrenceInterval
        updateData.recurrenceEndType = taskToUpdate.recurrenceEndType
        updateData.recurrenceCount = taskToUpdate.recurrenceCount
        updateData.recurrenceEndDate = taskToUpdate.recurrenceEndDate
        updateData.nextDeadlines = taskToUpdate.nextDeadlines
      }

      // Update the task in Firestore
      const taskRef = doc(db, "tasks", taskId)
      await updateDoc(taskRef, updateData)

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
      const currentDate = new Date()

      // Set the appropriate status based on deadline comparison
      const newStatus = currentDate <= deadlineDate ? "Completed On Time" : "Completed Overdue"

      await updateDoc(taskRef, {
        status: newStatus,
        completed: completedDate,
      })

      // Update local state
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus, completed: completedDate } : task)),
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

  // Helper function to generate safe keys
  const generateSafeKey = (prefix: string, id: string, suffix?: string) => {
    const cleanId = id.replace(/[^a-zA-Z0-9]/g, "")
    const cleanSuffix = suffix ? suffix.replace(/[^a-zA-Z0-9]/g, "") : ""
    return `${prefix}-${cleanId}${cleanSuffix ? `-${cleanSuffix}` : ""}`
  }

  // Filter users for dropdowns
  const getFilteredUsers = () => {
    return users.filter((userItem) => {
      const isCurrentUser = userItem.name === userName
      const isCurrentUserAdmin = userRole === "admin"
      const isUserRoleUser = userItem.role === "user"

      if (isCurrentUserAdmin) {
        return !isCurrentUser && isUserRoleUser
      }
      return !isCurrentUser
    })
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
          <span className="text-3xl text-[#8B2332] font-bold">Admin</span>
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

          {/* Receiver dropdown with role-based filtering */}
          <Select value={selectedReceiver} onValueChange={handleReceiverChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Receiver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Receivers</SelectItem>
              {users
                .filter((userItem) => {
                  const isCurrentUser = userItem.email !== user?.email
                  if (userRole === "admin") {
                    return isCurrentUser && userItem.role === "user"
                  }
                  return isCurrentUser
                })
                .map((userItem, index) => (
                  <SelectItem
                    key={generateSafeKey("receiver-filter", userItem.id, index.toString())}
                    value={userItem.name}
                  >
                    {userItem.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className={activeFilter ? "bg-[#F5E6E8]" : ""}>
                Filters
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {[
                { key: "all", label: "All", value: null },
                { key: "pending", label: "Pending", value: "Pending" },
                { key: "verifying", label: "Verifying", value: "Verifying" },
                { key: "completed-on-time", label: "Completed On Time", value: "Completed On Time" },
                { key: "completed-overdue", label: "Completed Overdue", value: "Completed Overdue" },
                { key: "reopened", label: "Reopened", value: "Reopened" },
                { key: "high-priority", label: "High Priority", value: "High" },
                { key: "medium-priority", label: "Medium Priority", value: "Medium" },
                { key: "low-priority", label: "Low Priority", value: "Low" },
                { key: "all-completed", label: "All Completed Tasks", value: "Completed" },
                { key: "all-overdue", label: "All Overdue Tasks", value: "Overdue" },
              ].map((filter) => (
                <DropdownMenuCheckboxItem
                  key={generateSafeKey("filter", filter.key)}
                  checked={activeFilter === filter.value}
                  onCheckedChange={() => setActiveFilter(activeFilter === filter.value ? null : filter.value)}
                >
                  {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className={activeSort ? "bg-[#F5E6E8]" : ""}>
                Sort
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuRadioGroup value={activeSort ?? ""} onValueChange={setActiveSort}>
                {[
                  { key: "default", label: "Default", value: "" },
                  { key: "name-asc", label: "Task Name (A-Z)", value: "nameAsc" },
                  { key: "name-desc", label: "Task Name (Z-A)", value: "nameDesc" },
                  { key: "receiver-asc", label: "Task Receiver (A-Z)", value: "receiverAsc" },
                  { key: "receiver-desc", label: "Task Receiver (Z-A)", value: "receiverDesc" },
                  { key: "assigned-asc", label: "Date Assigned (Oldest First)", value: "assignedAsc" },
                  { key: "assigned-desc", label: "Date Assigned (Newest First)", value: "assignedDesc" },
                  { key: "deadline-asc", label: "Deadline (Earliest First)", value: "deadlineAsc" },
                  { key: "deadline-desc", label: "Deadline (Latest First)", value: "deadlineDesc" },
                ].map((sort) => (
                  <DropdownMenuRadioItem key={generateSafeKey("sort", sort.key)} value={sort.value}>
                    {sort.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
            className="bg-[#8B2332] hover:bg-[#9B3342] text-white flex items-center gap-2"
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
                          {getFilteredUsers().map((userItem, index) => (
                            <SelectItem
                              key={generateSafeKey("new-task-assignee", userItem.id, index.toString())}
                              value={userItem.name}
                            >
                              {userItem.name}
                              {userItem.jobTitle ? ` (${userItem.jobTitle})` : ""}
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
                      <Input
                        id="deadline"
                        type="date"
                        name="deadline"
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
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
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch id="recurring-task" checked={isRecurringTask} onCheckedChange={handleRecurringToggle} />
                    <Label htmlFor="recurring-task">Make this a recurring task</Label>

                    {isRecurringTask && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRecurringModal(true)}
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
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8B2332]"></div>
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332]"></div>
            </div>
          )}

          {/* Existing Tasks */}
          {!loading && currentTasks.length > 0 ? (
            <div>
              {currentTasks.map((task, taskIndex) => (
                <div
                  key={generateSafeKey("task", task.id, taskIndex.toString())}
                  id={`task-${task.id}`}
                  className="bg-[#8B2332] text-white p-4 rounded mb-4"
                >
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
                            onValueChange={(value) => handleSelectChange("assignedTo", value, task.id)}
                          >
                            <SelectTrigger className="bg-white text-black">
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilteredUsers().map((userItem, index) => (
                                <SelectItem
                                  key={generateSafeKey("edit-task-assignee", task.id, `${userItem.id}-${index}`)}
                                  value={userItem.name}
                                >
                                  {userItem.name}
                                  {userItem.jobTitle ? ` (${userItem.jobTitle})` : ""}
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
                          <div className="flex items-center gap-2">
                            {task.name}
                            {task.isRecurring && (
                              <Badge
                                variant="outline"
                                className="bg-purple-100 text-purple-800 border-purple-300 text-xs"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
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
                          {task.assignedToJobTitle ? ` (${task.assignedToJobTitle})` : ""}
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
                            className="text-white hover:bg-[#9B3342] rounded p-1"
                            aria-label={expandedTasks[task.id] ? "Collapse task details" : "Expand task details"}
                          >
                            <ChevronDown size={16} />
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
                              onCheckedChange={(checked) => handleEditRecurringToggle(checked, task.id)}
                            />
                            <Label htmlFor={`recurring-task-${task.id}`}>Recurring task</Label>

                            {task.isRecurring && (
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

                          {/* Show recurring badge if task is recurring */}
                          {task.isRecurring && (
                            <div className="mt-2 mb-4">
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Recurring Task ({task.recurrencePattern})
                              </Badge>
                              {/* Display recurrence deadlines */}
                              {task.nextDeadlines && task.nextDeadlines.length > 0 && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <strong>Upcoming Deadlines:</strong>
                                  <ul className="list-disc ml-6">
                                    {task.nextDeadlines.map((date, idx) => (
                                      <li key={generateSafeKey("deadline", task.id, `${idx}-${date}`)}>{date}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex flex-wrap justify-between mt-4">
                        <div className="space-x-2 mb-2">
                          {task.files && task.files.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {task.files.map((file, index) => (
                                <Button
                                  key={generateSafeKey("file", task.id, `${index}-${file.name}`)}
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(file.url, "_blank")}
                                >
                                  {file.name}
                                </Button>
                              ))}
                            </div>
                          )}
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
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8B2332]"></div>
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No tasks match your current filters</p>
              </div>
            )
          )}
          {/* Pagination Controls */}
          {!loading && totalTasks > 0 && (
            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {startIndex + 1} to {Math.min(endIndex, totalTasks)} of {totalTasks} tasks
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1

                      return (
                        <React.Fragment key={generateSafeKey("pagination", page.toString())}>
                          {showEllipsis && <span className="px-2 py-1 text-gray-500">...</span>}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] ${
                              currentPage === page ? "bg-[#8B2332] hover:bg-[#9B3342] text-white" : ""
                            }`}
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      )
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
