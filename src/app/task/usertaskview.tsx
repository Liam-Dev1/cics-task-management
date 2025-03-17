"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Paperclip, Search, Send } from "lucide-react"
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
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Sidebar } from "@/components/sidebar-user"

// Task interface definition
interface Task {
  id: string
  name: string
  assignedBy: string
  assignedTo: string
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

  type SortValue = string | null
  const [activeSort, setActiveSort] = useState<SortValue>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  // Fetch tasks from Firestore
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)

        // Get current user email from auth
        const userEmail = auth.currentUser?.email
        if (!userEmail) {
          console.error("No user email found")
          return
        }

        // Get user's name from Firestore
        const usersRef = collection(db, "users")
        const userQuery = query(usersRef, where("email", "==", userEmail))
        const userSnapshot = await getDocs(userQuery)

        if (userSnapshot.empty) {
          console.error("No user found with this email")
          return
        }

        const userData = userSnapshot.docs[0].data()
        const userName = userData.name || userData.displayName || "Unknown User"

        // Query tasks assigned to this user
        const tasksCollection = collection(db, "tasks")
        const tasksQuery = query(tasksCollection, where("assignedTo", "==", userName), orderBy("assignedOn", "desc"))

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
        console.log("Error: Failed to load tasks. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

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

  // Upload file to Firebase Storage
  const uploadFileToStorage = async (file: File, taskId: string): Promise<string> => {
    const fileRef = ref(storage, `tasks/${taskId}/${file.name}`)
    await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(fileRef)
    return downloadURL
  }

  const handleFileAttachment = async (taskId: string) => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"

    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        try {
          setUploadingFile(true)
          const selectedFile = target.files[0]

          // Upload file to Firebase Storage
          const fileUrl = await uploadFileToStorage(selectedFile, taskId)

          // Get the current task
          const taskToUpdate = tasks.find((task) => task.id === taskId)
          if (!taskToUpdate) return

          // Prepare the updated files array
          const updatedFiles = [...(taskToUpdate.files || []), { name: selectedFile.name, url: fileUrl }]

          // Update the task in Firestore
          const taskRef = doc(db, "tasks", taskId)
          await updateDoc(taskRef, {
            files: updatedFiles,
          })

          // Update local state
          setTasks(
            tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    files: updatedFiles,
                  }
                : task,
            ),
          )

          console.log("Success: File attached successfully")
        } catch (error) {
          console.error("Error attaching file:", error)
          console.log("Error: Failed to attach file. Please try again.")
        } finally {
          setUploadingFile(false)
        }
      }
    }

    fileInput.click()
  }

  const handleTaskSubmit = async (taskId: string) => {
    try {
      // Update the task in Firestore
      const taskRef = doc(db, "tasks", taskId)
      const completedDate = new Date().toISOString().split("T")[0]

      await updateDoc(taskRef, {
        status: "Verifying",
        completed: completedDate,
      })

      // Update local state
      setTasks(
        tasks.map((task) => (task.id === taskId ? { ...task, status: "Verifying", completed: completedDate } : task)),
      )

      console.log("Success: Task submitted for verification")
    } catch (error) {
      console.error("Error submitting task:", error)
      console.log("Error: Failed to submit task. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-6">
          <h1 className="mb-6">
            <span className="text-5xl font-bold">Tasks</span>
          </h1>

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
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-800"></div>
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
                        <p className="my-2">{task.description}</p>
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
                          <div className="space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFileAttachment(task.id)}
                              disabled={uploadingFile}
                            >
                              {uploadingFile ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-800 mr-1"></div>
                              ) : (
                                <Paperclip className="mr-1 h-4 w-4" />
                              )}
                              Attach Files
                            </Button>
                            {task.status !== "Completed" && task.status !== "Verifying" && (
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
    </div>
  )
}

