"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, Paperclip, Send } from "lucide-react"
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
import { auth, db, storage } from "@/lib/firebase/firebase.config"
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useSearchParams } from "next/navigation"

// Task interface definition
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
}

export default function UserTaskViewWrapper() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()

  type SortValue = string | null
  const [activeSort, setActiveSort] = useState<SortValue>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(searchParams.get("filter"))

  // Add after existing state declarations
  const [userRole, setUserRole] = useState<string | null>(null)

  // Add this useEffect for role monitoring
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!auth.currentUser?.email) return

      try {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", auth.currentUser.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          const newUserRole = userData.role || "user"

          // Check if role has changed
          if (userRole && userRole !== newUserRole) {
            // Role has changed, clear tasks and refetch
            setTasks([])
            setLoading(true)
            showNotification(`Your role has been updated to ${newUserRole}. Task access has been rescoped.`, "success")
          }

          setUserRole(newUserRole)
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
      }
    }

    fetchUserRole()
  }, [userRole])

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  // Check for expandable task from URL
  const taskIdFromUrl = searchParams.get("taskId")
  const expandFromUrl = searchParams.get("expand") === "true"

  // Load expandedTasks from localStorage on component mount
  useEffect(() => {
    const savedExpandedTasks = localStorage.getItem("expandedTasksInitial") || localStorage.getItem("expandedTasks")
    if (savedExpandedTasks) {
      try {
        setExpandedTasks(JSON.parse(savedExpandedTasks))
      } catch (error) {
        console.error("Error parsing saved expanded tasks:", error)
      }
    }

    // If there's a taskId in the URL and expand=true, make sure that task is expanded
    if (taskIdFromUrl && expandFromUrl) {
      setExpandedTasks((prev) => ({
        ...prev,
        [taskIdFromUrl]: true,
      }))
    }
  }, [taskIdFromUrl, expandFromUrl])

  // Save expandedTasks to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(expandedTasks).length > 0) {
      localStorage.setItem("expandedTasks", JSON.stringify(expandedTasks))
    }
  }, [expandedTasks])

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
          return
        }

        // Check user role before fetching tasks
        const usersRef = collection(db, "users")
        const userQuery = query(usersRef, where("email", "==", auth.currentUser?.email))
        const userSnapshot = await getDocs(userQuery)

        let currentUserRole = "user"
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data()
          currentUserRole = userData.role || "user"
          setUserRole(currentUserRole)
        }

        // If user has been promoted to admin/super admin, they should use admin view
        if (currentUserRole === "admin" || currentUserRole === "super admin") {
          showNotification("You have been promoted! Please use the admin task view.", "success")
          // Optionally redirect to admin view or show different interface
          return
        }

        // Query tasks assigned to this user by ID (only for regular users)
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

        // Fetch user data to ensure we have job titles
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

        // Preserve expanded states for existing tasks and initialize new ones to false
        setExpandedTasks((prevExpandedState) => {
          const updatedExpandedState = { ...prevExpandedState }
          updatedTasks.forEach((task) => {
            if (updatedExpandedState[task.id] === undefined) {
              updatedExpandedState[task.id] = false
            }
          })
          return updatedExpandedState
        })
      } catch (error) {
        console.error("Error fetching tasks:", error)
        showNotification("Failed to load tasks. Please try again.", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [userRole]) // Add userRole as dependency

  // Filter tasks based on search query and active filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      !activeFilter ||
      (["Pending", "Verifying", "Completed On Time", "Completed Overdue", "Reopened"].includes(activeFilter) &&
        task.status === activeFilter) ||
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

  // Update the handleTaskSubmit function to determine if the task is completed on time or overdue
  const handleTaskSubmit = async (taskId: string) => {
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

      // For users, we'll set it to "Verifying" first, but we'll also check if it's on time
      // This information will be useful when the admin verifies the task
      const isOnTime = currentDate <= deadlineDate

      await updateDoc(taskRef, {
        status: "Verifying",
        completed: completedDate,
        isCompletedOnTime: isOnTime, // Store this information for the admin
      })

      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "Verifying",
                completed: completedDate,
                isCompletedOnTime: isOnTime,
              }
            : task,
        ),
      )

      showNotification("Task submitted for verification", "success")
    } catch (error) {
      console.error("Error submitting task:", error)
      showNotification("Failed to submit task. Please try again.", "error")
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
            taskElement.classList.add("glow")
            setTimeout(() => {
              taskElement.classList.remove("glow")
            }, 2000)
          }
        }, 300)
      }
    }
  }, [taskIdFromUrl, tasks])

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
          <span className="text-3xl text-red-800 font-bold">User</span>
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
          <div className="grid grid-cols-7 gap-4 font-semibold mb-2 hidden md:grid text-center">
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
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-800"></div>
            </div>
          )}

          {/* Existing Tasks */}
          {!loading && sortedTasks.length > 0
            ? sortedTasks.map((task) => (
                <div key={task.id} id={`task-${task.id}`} className="bg-[#8B2332] text-white p-4 rounded">
                  <div className="grid md:grid-cols-7 gap-4">
                    <div className="md:col-span-1 text-center">
                      <span className="md:hidden font-semibold">Task Name: </span>
                      {task.name}
                    </div>
                    <div className="md:col-span-1 text-center">
                      <span className="md:hidden font-semibold">Assigned by: </span>
                      {task.assignedBy}
                    </div>
                    <div className="md:col-span-1 text-center">
                      <span className="md:hidden font-semibold">Assigned to: </span>
                      {task.assignedTo}
                      {task.assignedToJobTitle ? ` (${task.assignedToJobTitle})` : ""}
                    </div>
                    <div className="md:col-span-1 text-center">
                      <span className="md:hidden font-semibold">Assigned on: </span>
                      {task.assignedOn}
                    </div>
                    <div className="md:col-span-1 text-center">
                      <span className="md:hidden font-semibold">Deadline: </span>
                      {task.deadline}
                    </div>
                    <div className="md:col-span-1 text-center">
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
                    <div className="md:col-span-1 flex justify-center items-center">
                      <div className="text-center">
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
                        className="text-white hover:bg-[#9B3342] rounded p-1 ml-2"
                        aria-label={expandedTasks[task.id] ? "Collapse task details" : "Expand task details"}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  {expandedTasks[task.id] && (
                    <div className="bg-white text-black p-4 rounded mt-2">
                      <p className="my-2">{task.description}</p>
                      <div className="flex flex-wrap justify-center mt-4">
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
                        <div className="flex flex-row space-x-2 justify-center w-full">
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
                          {task.status !== "Completed On Time" &&
                            task.status !== "Completed Overdue" &&
                            task.status !== "Verifying" && (
                              <Button variant="default" size="sm" onClick={() => handleTaskSubmit(task.id)}>
                                <Send className="mr-1 h-4 w-4" />
                                Submit
                              </Button>
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
    </div>
  )
}
