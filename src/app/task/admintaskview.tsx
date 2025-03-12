"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronDown, Search, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, 
  DropdownMenuRadioGroup, DropdownMenuRadioItem} from "@/components/ui/dropdown-menu"
import { Sidebar } from "@/components/ui/sidebar"

// Mock storage for demo purposes
const mockStorage = {
  uploadFile: async (file) => {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `https://example.com/files/${file.name}`
  },
}

export default function TaskManagement() {
  const [showNewTask, setShowNewTask] = useState(false)
  const [tasks, setTasks] = useState([])
  const [editingTask, setEditingTask] = useState(null)
  const [editingTaskOriginal, setEditingTaskOriginal] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [activeSort, setActiveSort] = useState<string | null>(null)

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

  const handleInputChange = (e, taskId = null) => {
    const { name, value } = e.target
    if (taskId !== null) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [name]: value } : task)))
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()

    let fileUrl = ""
    if (file) {
      try {
        // Using our mock storage instead of Firebase
        fileUrl = await mockStorage.uploadFile(file)
      } catch (error) {
        console.error("Error uploading file:", error)
      }
    }

    const newTask = {
      id: tasks.length + 1,
      name: e.target.name.value,
      assignedBy: "J Jonah Jameson",
      assignedTo: e.target.assignedTo.value,
      assignedOn: new Date().toLocaleDateString(),
      deadline: e.target.deadline.value,
      status: e.target.status.value,
      priority: e.target.priority.value,
      description: e.target.description.value,
      files: fileUrl ? [{ name: file.name, url: fileUrl }] : [],
    }

    setTasks((prev) => [...prev, newTask])
    setFile(null)
    setShowNewTask(false)
    e.target.reset()
  }

  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId)
    setEditingTask(taskId)
    setEditingTaskOriginal({ ...taskToEdit }) // Store a copy of the original task
  }

  const handleSaveEdit = (taskId) => {
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

  const handleVerifyCompletion = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "Completed", completed: new Date().toLocaleDateString() } : task,
      ),
    )
  }

  const handleReopenTask = (taskId) => {
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
                <DropdownMenuRadioGroup value={activeSort} onValueChange={setActiveSort}>
                  <DropdownMenuRadioItem value={null}>Default</DropdownMenuRadioItem>
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
                      onValueChange={(value) => handleInputChange({ target: { name: "assignedTo", value } }, task.id)}
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
                      onValueChange={(value) => handleInputChange({ target: { name: "status", value } }, task.id)}
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
                      onValueChange={(value) => handleInputChange({ target: { name: "priority", value } }, task.id)}
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

