"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp, Paperclip, Search, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { Button } from "@/components/ui/button"

// Task interface definition
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

export default function UserTaskView() {
  // Mock tasks for demonstration
  const mockTasks: Task[] = [
    {
      id: 1,
      name: "Complete quarterly report",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "2023-03-15",
      deadline: "2023-03-25",
      status: "Pending",
      priority: "High",
      description:
        "Compile all department statistics and prepare the quarterly performance report. Include charts and projections for the next quarter.",
      files: [{ name: "Report_Template.docx", url: "https://example.com/files/template.docx" }],
    },
    {
      id: 2,
      name: "Website redesign feedback",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "2023-03-10",
      deadline: "2023-03-18",
      status: "Completed",
      completed: "2023-03-17",
      priority: "Medium",
      description:
        "Review the new website mockups and provide detailed feedback on usability, design, and content placement.",
    },
    {
      id: 3,
      name: "Photograph city event",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "2023-03-20",
      deadline: "2023-03-22",
      status: "Verifying",
      priority: "High",
      description:
        "Take high-quality photographs of the downtown charity event. Ensure you capture key speakers and crowd reactions.",
    },
    {
      id: 4,
      name: "Update employee handbook",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "2023-02-28",
      deadline: "2023-04-01",
      status: "Pending",
      priority: "Low",
      description:
        "Review and update the employee handbook with new company policies and procedures. Coordinate with HR for accuracy.",
    },
    {
      id: 5,
      name: "Social media content plan",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "2023-03-05",
      deadline: "2023-03-19",
      status: "Reopened",
      priority: "Medium",
      description:
        "Develop a content calendar for our social media channels for the next month. Include post ideas, hashtags, and optimal posting times.",
    },
  ]

  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [searchQuery, setSearchQuery] = useState("")
  type SortValue = string | null

  const [activeSort, setActiveSort] = useState<SortValue>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>(
    mockTasks.reduce((acc, task) => ({ ...acc, [task.id]: true }), {}),
  )

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

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  const handleFileAttachment = (taskId: number) => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        const fileName = target.files[0].name
        // In a real app, you would upload the file to a server here
        // For now, we'll just update the UI to show the file was attached
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  files: [...(task.files || []), { name: fileName, url: "#" }],
                }
              : task,
          ),
        )
      }
    }
    fileInput.click()
  }

  const handleTaskSubmit = (taskId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: "Verifying", completed: new Date().toISOString().split("T")[0] } : task,
      ),
    )
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

            {/* Existing Tasks - Now using sortedTasks */}
            {sortedTasks.map((task) => (
              <div key={task.id} className="grid grid-cols-7 gap-4 bg-[#8B2332] text-white p-4 rounded">
                <div>{task.name}</div>
                <div>{task.assignedBy}</div>
                <div>{task.assignedTo}</div>
                <div>{task.assignedOn}</div>
                <div>{task.deadline}</div>
                <div>{task.status}</div>
                <div className="flex justify-between items-center">
                  <span>{task.priority}</span>
                  <button
                    onClick={() => toggleTaskExpansion(task.id)}
                    className="text-white hover:bg-[#9B3342] rounded p-1"
                  >
                    {expandedTasks[task.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {expandedTasks[task.id] && (
                  <div className="col-span-7 bg-white text-black p-4 rounded mt-2">
                    <p className="my-2">{task.description}</p>
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
                        <Button variant="outline" size="sm" onClick={() => handleFileAttachment(task.id)}>
                          <Paperclip className="mr-1 h-4 w-4" />
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

