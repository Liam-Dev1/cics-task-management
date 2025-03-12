"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ChevronDown, Search, Upload } from "lucide-react"
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
import { Sidebar } from "@/components/ui/sidebar"

// First, update the FileObject interface to match the File API
interface FileObject extends File {
  name: string
  size: number
  type: string
}

// Also, make sure your Task type is properly defined by adding this interface
// after the FileObject interface and before the mockStorage definition:
interface Task {
  id: number
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

// Mock storage for demo purposes
// Update the mockStorage object with proper type annotations
const mockStorage = {
  uploadFile: async (file: FileObject) => {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `https://example.com/files/${file.name}`
  },
}

export default function TaskManagement() {
  const [showNewTask, setShowNewTask] = useState(false)
  // Then update the tasks state with proper typing:
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<number | null>(null)
  const [editingTaskOriginal, setEditingTaskOriginal] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  // Update the file state with proper typing
  const [file, setFile] = useState<FileObject | null>(null)
  // Update the ref definition with proper typing
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Find the line with activeSort and setActiveSort useState declaration
  // Replace it with this properly typed version:
  // Update the type definition for the sort values
  type SortValue = string | null

  const [activeSort, setActiveSort] = useState<SortValue>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

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

  // First, let's create a type for our input change handler
  type InputChangeHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    taskId: number | null,
  ) => void

  // Then create a separate handler for select changes
  const handleSelectChange = (name: string, value: string, taskId: number) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [name]: value } : task)))
  }

  // Update the handleInputChange function with proper typing
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    taskId: number | null = null,
  ) => {
    const { name, value } = e.target
    if (taskId !== null) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [name]: value } : task)))
    }
  }

  // Update the handleFileChange function to ensure type safety
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // Ensure the file has the required properties
      if ("name" in selectedFile) {
        setFile(selectedFile as FileObject)
      }
    }
  }

  // Then update the handleAddTask function with proper null checking
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    let fileUrl = ""
    if (file && "name" in file) {
      // Type guard to ensure file is a FileObject
      try {
        fileUrl = await mockStorage.uploadFile(file)
      } catch (error) {
        console.error("Error uploading file:", error)
      }
    }

    const form = e.currentTarget
    const formData = new FormData(form)

    const newTask: Task = {
      id: tasks.length + 1,
      name: (formData.get("name") as string) || "",
      assignedBy: "J Jonah Jameson",
      assignedTo: (formData.get("assignedTo") as string) || "",
      assignedOn: new Date().toLocaleDateString(),
      deadline: (formData.get("deadline") as string) || "",
      status: (formData.get("status") as string) || "Pending",
      priority: (formData.get("priority") as string) || "Medium",
      description: (formData.get("description") as string) || "",
      files: fileUrl && file ? [{ name: file.name, url: fileUrl }] : [],
    }

    setTasks((prev) => [...prev, newTask])
    setFile(null)
    setShowNewTask(false)
    form.reset()
  }

  // Update the task editing functions with proper typing
  const handleEditTask = (taskId: number) => {
    const taskToEdit = tasks.find((task) => task.id === taskId)
    if (!taskToEdit) return // Guard clause in case task is not found

    setEditingTask(taskId)
    setEditingTaskOriginal({ ...taskToEdit }) // Store a copy of the original task
  }

  const handleSaveEdit = (taskId: number) => {
    setEditingTask(null)
    setEditingTaskOriginal(null)
  }

  const handleCancelEdit = () => {
    if (editingTaskOriginal) {
      setTasks((prev) => prev.map((task) => (task.id === editingTaskOriginal.id ? editingTaskOriginal : task)))
    }
    setEditingTask(null)
    setEditingTaskOriginal(null)
  }

  const handleVerifyCompletion = (taskId: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "Completed", completed: new Date().toLocaleDateString() } : task,
      ),
    )
  }

  const handleReopenTask = (taskId: number) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: "Reopened", completed: null } : task)),
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-6">
          <h1 className="mb-6">
            <span className="text-5xl font-bold">Tasks</span>{" "}
            <span className="text-3xl text-red-800 font-bold">Admin</span>
          </h1>

          {/* Action Bar */}
          <div className="flex gap-2 mb-6">
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
                <SelectItem value="peter">Peter Parker</SelectItem>
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
            <div className="grid grid-cols-7 gap-4 font-semibold mb-2">
              <div>Task Name</div>
              <div>Assigned by</div>
              <div>Assigned to</div>
              <div>Assigned on</div>
              <div>Deadline</div>
              <div>Status</div>
              <div>Priority</div>
            </div>

            {/* Add New Task Button */}
            <Button onClick={() => setShowNewTask(true)} className="bg-red-800 hover:bg-red-900 text-white">
              + Add New Task
            </Button>

            {/* New Task Form */}
            {showNewTask && (
              <form onSubmit={handleAddTask} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-7 gap-4">
                  <Input placeholder="Insert Task Name Here" name="name" required />
                  <div>J Jonah Jameson</div>
                  <Select name="assignedTo" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Peter Parker">Peter Parker</SelectItem>
                    </SelectContent>
                  </Select>
                  <div>{new Date().toLocaleDateString()}</div>
                  <Input type="date" name="deadline" required />
                  <Select name="status" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Verifying">Verifying</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Add Description Here" className="mt-4 mb-4" name="description" required />
                <div className="flex justify-between">
                  {/* Then the button can be typed correctly */}
                  <Button
                    type="button"
                    variant="outline"
                    className="flex gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Attach Files
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <Button type="submit">Assign Task</Button>
                </div>
                {file && <p className="mt-2">File attached: {file.name}</p>}
              </form>
            )}

            {/* Existing Tasks - Now using sortedTasks */}
            {sortedTasks.map((task) => (
              <div key={task.id} className="grid grid-cols-7 gap-4 bg-red-800 text-white p-4 rounded">
                {editingTask === task.id ? (
                  <>
                    <Input
                      name="name"
                      value={task.name}
                      onChange={(e) => handleInputChange(e, task.id)}
                      className="bg-white text-black"
                    />
                    <div>{task.assignedBy}</div>
                    <Select
                      name="assignedTo"
                      value={task.assignedTo}
                      onValueChange={(value) => handleSelectChange("assignedTo", value, task.id)}
                    >
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Peter Parker">Peter Parker</SelectItem>
                      </SelectContent>
                    </Select>
                    <div>{task.assignedOn}</div>
                    <Input
                      type="date"
                      name="deadline"
                      value={task.deadline}
                      onChange={(e) => handleInputChange(e, task.id)}
                      className="bg-white text-black"
                    />
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
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Reopened">Reopened</SelectItem>
                      </SelectContent>
                    </Select>
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
                  </>
                ) : (
                  <>
                    <div>{task.name}</div>
                    <div>{task.assignedBy}</div>
                    <div>{task.assignedTo}</div>
                    <div>{task.assignedOn}</div>
                    <div>{task.deadline}</div>
                    <div>{task.status}</div>
                    <div>{task.priority}</div>
                  </>
                )}
                <div className="col-span-7 bg-white text-black p-4 rounded mt-2">
                  {editingTask === task.id ? (
                    <Textarea
                      placeholder="Add Description Here"
                      className="mt-2 mb-4"
                      name="description"
                      value={task.description}
                      onChange={(e) => handleInputChange(e, task.id)}
                    />
                  ) : (
                    <p className="my-2">{task.description}</p>
                  )}
                  <div className="flex justify-between mt-4">
                    <div className="space-x-2">
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
                      {editingTask === task.id ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => handleSaveEdit(task.id)}>
                            Save Changes
                          </Button>
                          <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleEditTask(task.id)}>
                          Edit Task
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerifyCompletion(task.id)}
                        disabled={task.status === "Completed"}
                      >
                        Verify Completion
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReopenTask(task.id)}
                        disabled={task.status !== "Completed"}
                      >
                        Reopen Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

