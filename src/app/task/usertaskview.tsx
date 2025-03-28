"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, Paperclip, Search, Send, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { auth, db, storage } from "@/app/firebase/firebase.config"
import { collection, query, where, getDocs, updateDoc, doc, orderBy, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Sidebar } from "@/components/sidebar-user"

// Task interface definition
interface Task {
  id: string
  name: string
  assignedBy: string
  assignedTo: string
  assignedToEmail: string
  assignedToId: string // User's ID for querying
  assignedOn: string
  deadline: string
  status: string
  priority: string
  description: string
  completed?: string | null
  files?: Array<{ name: string; url: string }>
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  type SortValue = string | null
  const [activeSort, setActiveSort] = useState<SortValue>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  })

  // Show notification
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ message: "", type: null })
    }, 3000)
  }

  // Fetch tasks from Firestore
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)

        // Get current user ID from auth
        const userId = auth.currentUser?.uid
        if (!userId) {
          console.error("No user ID found")
          setLoading(false)
          return
        }

        // Query tasks assigned to this user by ID
        const tasksCollection = collection(db, "tasks")
        const tasksQuery = query(tasksCollection, where("assignedToId", "==", userId), orderBy("assignedOn", "desc"))

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

    // Only fetch tasks when the user is authenticated
    if (auth.currentUser) {
      fetchTasks()
    }
  }, [auth.currentUser])

  // Add a real-time listener for task updates
  useEffect(() => {
    if (!auth.currentUser?.uid) return

    const userId = auth.currentUser.uid
    const tasksCollection = collection(db, "tasks")
    const tasksQuery = query(tasksCollection, where("assignedToId", "==", userId))

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const updatedTasks: Task[] = []
        snapshot.forEach((doc) => {
          updatedTasks.push({
            id: doc.id,
            ...(doc.data() as Omit<Task, "id">),
          })
        })

        // Sort by assignedOn date (newest first)
        updatedTasks.sort((a, b) => {
          return new Date(b.assignedOn).getTime() - new Date(a.assignedOn).getTime()
        })

        setTasks(updatedTasks)
      },
      (error) => {
        console.error("Error in real-time listener:", error)
        showNotification("Error receiving task updates.", "error")
      },
    )

    // Clean up listener on component unmount
    return () => unsubscribe()
  }, [auth.currentUser?.uid])

  // Filter tasks based on search query and active filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      !activeFilter ||
      (["Pending", "Verifying", "Completed", "Reopened"].includes(activeFilter) && task.status === activeFilter) ||
      (["High", "Medium", "Low"].includes(activeFilter) && task.priority === activeFilter)
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

  // Handle file change
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

  const handleFileAttachment = (taskId: string) => {
    setUploadingTaskId(taskId)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Add a function to handle task status updates
  // Add this function before the return statement:

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // Update the task in Firestore
      const taskRef = doc(db, "tasks", taskId)
      const updateData: Record<string, any> = { status: newStatus }

      // If marking as completed or verifying, add completion date
      if (newStatus === "Verifying") {
        updateData.completed = new Date().toISOString().split("T")[0]
      }

      await updateDoc(taskRef, updateData)

      showNotification(`Task ${newStatus === "Verifying" ? "submitted for verification" : "updated"}`, "success")
    } catch (error) {
      console.error("Error updating task status:", error)
      showNotification("Failed to update task. Please try again.", "error")
    }
  }

  // Replace the handleTaskSubmit function with this:
  const handleTaskSubmit = async (taskId: string) => {
    await handleTaskStatusUpdate(taskId, "Verifying")
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
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
            <span className="text-5xl font-bold">Tasks</span>
          </h1>

          {/* Hidden file input */}
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
                  checked={activeFilter === "Completed"}
                  onCheckedChange={() => setActiveFilter(activeFilter === "Completed" ? null : "Completed")}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeFilter === "Reopened"}
                  onCheckedChange={() => setActiveFilter(activeFilter === "Reopened" ? null : "Reopened")}
                >
                  Reopened
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
                  <DropdownMenuRadioItem value="assignedAsc">Date Assigned (Oldest First)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="assignedDesc">Date Assigned (Newest First)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="deadlineAsc">Deadline (Earliest First)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="deadlineDesc">Deadline (Latest First)</DropdownMenuRadioItem>
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

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332] mb-4"></div>
                <p className="text-gray-600">Loading your tasks...</p>
              </div>
            )}

            {/* Existing Tasks */}
            {!loading && sortedTasks.length > 0
              ? sortedTasks.map((task) => (
                  <div key={task.id} className="bg-[#8B2332] text-white p-4 rounded">
                    <div className="grid md:grid-cols-7 gap-4">
                      <div className="md:col-span-1">
                        <span className="md:hidden font-semibold">Task Name: </span>
                        {task.name}
                      </div>
                      <div className="md:col-span-1">
                        <span className="md:hidden font-semibold">Assigned by: </span>
                        {task.assignedBy}
                      </div>
                      <div className="md:col-span-1">
                        <span className="md:hidden font-semibold">Assigned to: </span>
                        {task.assignedTo}
                      </div>
                      <div className="md:col-span-1">
                        <span className="md:hidden font-semibold">Assigned on: </span>
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
                            task.status === "Completed"
                              ? "bg-green-600"
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
                          {expandedTasks[task.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {expandedTasks[task.id] && (
                      <div className="bg-white text-black p-4 rounded mt-2">
                        <p className="my-2 whitespace-pre-line">{task.description}</p>

                        {/* Task details */}
                        <div className="mt-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-semibold">Assigned by:</span> {task.assignedBy}
                          </div>
                          <div>
                            <span className="font-semibold">Assigned on:</span> {task.assignedOn}
                          </div>
                          <div>
                            <span className="font-semibold">Deadline:</span> {task.deadline}
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span>
                            <span
                              className={
                                task.status === "Completed"
                                  ? "text-green-600 font-medium"
                                  : task.status === "Verifying"
                                    ? "text-yellow-600 font-medium"
                                    : task.status === "Reopened"
                                      ? "text-purple-600 font-medium"
                                      : "text-blue-600 font-medium"
                              }
                            >
                              {" " + task.status}
                            </span>
                          </div>
                        </div>

                        {/* Files section */}
                        {task.files && task.files.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Attached Files:</h4>
                            <div className="flex flex-wrap gap-2">
                              {task.files.map((file, index) => (
                                <Button
                                  key={index}
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(file.url, "_blank")}
                                  className="flex items-center gap-1"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap justify-end mt-4 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileAttachment(task.id)}
                            disabled={uploadingFile}
                          >
                            {uploadingFile && uploadingTaskId === task.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-800 mr-1"></div>
                            ) : (
                              <Paperclip className="mr-1 h-4 w-4" />
                            )}
                            Attach Files
                          </Button>

                          {task.status === "Pending" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleTaskSubmit(task.id)}
                              className="bg-[#8B2332] hover:bg-[#9f393b]"
                            >
                              <Send className="mr-1 h-4 w-4" />
                              Submit for Verification
                            </Button>
                          )}

                          {task.status === "Reopened" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleTaskSubmit(task.id)}
                              className="bg-[#8B2332] hover:bg-[#9f393b]"
                            >
                              <Send className="mr-1 h-4 w-4" />
                              Resubmit
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              : !loading && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                      <ClipboardList className="h-12 w-12 mx-auto text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No tasks found</h3>
                    <p className="text-gray-500">
                      {activeFilter
                        ? "No tasks match your current filters. Try changing or clearing your filters."
                        : "You don't have any assigned tasks yet."}
                    </p>
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  )
}

