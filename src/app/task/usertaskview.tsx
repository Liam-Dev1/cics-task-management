"use client"

import { useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
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

// Mock storage for demo purposes
const mockStorage = {
  uploadFile: async (file: File) => {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `https://example.com/files/${file.name}`
  },
}

export default function TaskManagement() {
  // Mock tasks data
  const mockTasks = [
    {
      id: 1,
      name: "Website Redesign",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "03/05/2025",
      deadline: "03/20/2025",
      status: "Pending",
      priority: "High",
      description:
        "Redesign the company website homepage with new branding guidelines. Focus on mobile responsiveness and improved user experience.",
      files: [{ name: "branding-guidelines.pdf", url: "https://example.com/files/branding-guidelines.pdf" }],
    },
    {
      id: 2,
      name: "Quarterly Report",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "02/28/2025",
      deadline: "03/15/2025",
      status: "Completed",
      priority: "Medium",
      description: "Compile Q1 performance metrics and create a comprehensive report with visual data representations.",
      files: [
        { name: "q1-data.xlsx", url: "https://example.com/files/q1-data.xlsx" },
        { name: "report-template.docx", url: "https://example.com/files/report-template.docx" },
      ],
    },
    {
      id: 3,
      name: "Client Presentation",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "03/08/2025",
      deadline: "03/10/2025",
      status: "Verifying",
      priority: "High",
      description:
        "Prepare a presentation for the Oscorp client meeting. Include project timeline, deliverables, and budget breakdown.",
      files: [],
    },
    {
      id: 4,
      name: "Social Media Campaign",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "03/01/2025",
      deadline: "03/30/2025",
      status: "Pending",
      priority: "Low",
      description:
        "Develop a social media campaign for the upcoming product launch. Create content calendar and draft posts for approval.",
      files: [{ name: "social-media-strategy.pdf", url: "https://example.com/files/social-media-strategy.pdf" }],
    },
    {
      id: 5,
      name: "Bug Fixes for Mobile App",
      assignedBy: "J Jonah Jameson",
      assignedTo: "Peter Parker",
      assignedOn: "03/07/2025",
      deadline: "03/09/2025",
      status: "Reopened",
      priority: "High",
      description:
        "Address critical bugs in the mobile app reported by users. Focus on login issues and payment processing errors.",
      files: [{ name: "bug-report.pdf", url: "https://example.com/files/bug-report.pdf" }],
    },
  ]

  const [tasks, setTasks] = useState(mockTasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  // Fix: Change from string | null to string | undefined
  const [activeSort, setActiveSort] = useState<string>("")

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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-6">
          <h1 className="mb-6">
            <span className="text-5xl font-bold">Tasks</span>{" "}
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
              <div key={task.id} className="grid grid-cols-7 gap-4 bg-red-800 text-white p-4 rounded">
                <div>{task.name}</div>
                <div>{task.assignedBy}</div>
                <div>{task.assignedTo}</div>
                <div>{task.assignedOn}</div>
                <div>{task.deadline}</div>
                <div>{task.status}</div>
                <div>{task.priority}</div>
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

