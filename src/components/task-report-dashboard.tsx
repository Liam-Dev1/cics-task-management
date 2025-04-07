"use client"
import { useEffect, useState, useMemo, useRef } from "react"
import { fetchTaskData } from "@/lib/task-data"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns"
import { TaskCompletionPieChart } from "@/components/task-completion-pie-chart"
import { ProgressBar } from "@/components/progress-bar"
import { AverageCompletionTimeChart } from "@/components/average-completion-time-chart"
import { TaskCompletionStatusChart } from "@/components/task-completion-status-chart"
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip"
import { taskData } from "@/lib/task-data"
import { ExportToPdfButton } from "@/components/export-to-pdf-button"
import { LoadingOverlay } from "@/components/loading-overlay"
import { LoadingOverlay2 } from "@/components/loading-overlay2"




export default function TaskReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState<"pieCharts" | "lineCharts" | "barCharts">("pieCharts");
  const [showGraphs, setShowGraphs] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  
  const [currentFilters, setCurrentFilters] = useState({
    taskReceivers: [] as string[],
    fromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    toDate: new Date(),
    taskStatus: [] as string[],
    priority: [] as string[],
  });
  
  const [appliedFilters, setAppliedFilters] = useState(currentFilters);
  const [isExporting, setIsExporting] = useState(false);
  const [exportTimeFrame, setExportTimeFrame] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [exportTab, setExportTab] = useState<"pieCharts" | "lineCharts" | "barCharts">("pieCharts");
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTaskData();
      setLoading(false);
    };
    
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    return taskData.tasks.filter((task) => {
      const matchesReceiver =
        currentFilters.taskReceivers.length === 0 || currentFilters.taskReceivers.includes(task.assignedTo)
      const matchesStatus = appliedFilters.taskStatus.length === 0 || appliedFilters.taskStatus.includes(task.status)
      const matchesPriority = appliedFilters.priority.length === 0 || appliedFilters.priority.includes(task.priority)
      const taskDate = new Date(task.assignedOn)
      const isWithinDateRange =
        (!appliedFilters.fromDate || taskDate >= appliedFilters.fromDate) &&
        (!appliedFilters.toDate || taskDate <= appliedFilters.toDate)
      return matchesReceiver && matchesStatus && matchesPriority && isWithinDateRange
    })
  }, [appliedFilters, currentFilters.taskReceivers, currentFilters.taskReceivers.length])

  const stats = useMemo(() => {
    const tasksAssigned = filteredTasks.length
    const completedTasks = filteredTasks.filter((task) => task.status === "Completed").length
    const pendingTasks = filteredTasks.filter((task) => task.status === "Pending").length
    const overdueTasks = filteredTasks.filter((task) => task.status === "Overdue").length
    const completedOnTime = filteredTasks.filter(
      (task) => task.status === "Completed" && task.completionTime <= 100,
    ).length
    const completedLate = filteredTasks.filter(
      (task) => task.status === "Completed" && task.completionTime > 100,
    ).length
    const notCompleted = tasksAssigned - completedTasks
    const avgCompletionTime =
      filteredTasks.filter((task) => task.completionTime !== null).reduce((sum, task) => sum + task.completionTime, 0) /
        completedTasks || 0
    const avgCompletionRate = (completedTasks / tasksAssigned) * 100 || 0

    return {
      tasksAssigned,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completedOnTime,
      completedLate,
      notCompleted,
      avgCompletionTime: Math.round(avgCompletionTime),
      avgCompletionRate: Math.round(avgCompletionRate),
    }
  }, [filteredTasks])

  const chartData = useMemo(() => {
    const completedTasksBreakdown = [
      { name: "On Time", value: stats.completedOnTime, color: "#8B2332" },
      { name: "Late", value: stats.completedLate, color: "#4A5568" },
      { name: "Not Completed", value: stats.notCompleted, color: "#1E1E1E" },
    ]

    const overallTasksBreakdown = [
      { name: "Completed", value: stats.completedTasks, color: "#8B2332" },
      { name: "Pending", value: stats.pendingTasks, color: "#4A5568" },
      { name: "Overdue", value: stats.overdueTasks, color: "#1E1E1E" },
    ]



    const completionTimingBreakdown = [
      {
        name: "Early (≤30%)",
        value: filteredTasks.filter((task) => task.completionTime && task.completionTime <= 30).length,
        color: "#8B2332",
      },
      {
        name: "Normal (31-60%)",
        value: filteredTasks.filter(
          (task) => task.completionTime && task.completionTime > 30 && task.completionTime <= 60,
        ).length,
        color: "#4A5568",
      },
      {
        name: "Near Deadline (61-90%)",
        value: filteredTasks.filter(
          (task) => task.completionTime && task.completionTime > 60 && task.completionTime <= 90,
        ).length,
        color: "#4A5568",
      },
      {
        name: "On Deadline (>90%)",
        value: filteredTasks.filter((task) => task.completionTime && task.completionTime > 90).length,
        color: "#1E1E1E",
      },
    ]

    const getWeeklyData = (fromDate: Date, toDate: Date) => {
      const data = []
      const startDate = startOfWeek(fromDate)
      const endDate = endOfWeek(toDate)

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
        let periodEnd = new Date(date)
        periodEnd.setDate(periodEnd.getDate() + 7)
        periodEnd = periodEnd > endDate ? endDate : periodEnd

        const tasksInPeriod = filteredTasks.filter((task) => {
          const taskDate = new Date(task.completed || task.deadline)
          return taskDate >= date && taskDate < periodEnd && task.status === "Completed"
        })

        const avgCompletionTime =
          tasksInPeriod.reduce((sum, task) => sum + (task.completionTime || 0), 0) / tasksInPeriod.length || 0

        const monthName = date.toLocaleString("default", { month: "short" })
        const weekNumber = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1
        data.push({
          name: `Week ${weekNumber} (${monthName})`,
          value: Math.round(avgCompletionTime),
          startDate: date.toISOString(),
          endDate: periodEnd.toISOString(),
        })
      }

      return data
    }

    const getAverageCompletionTimeData = (timeFrame) => {
      if (timeFrame === "weekly") {
        return getWeeklyData(appliedFilters.fromDate, appliedFilters.toDate)
      }

      const data = []
      const fromDate = appliedFilters.fromDate
      const toDate = appliedFilters.toDate
      let startDate, endDate, increment, format

      switch (timeFrame) {
        case "monthly":
          startDate = startOfMonth(fromDate)
          endDate = endOfMonth(toDate)
          increment = 1
          format = (date) => date.toLocaleString("default", { month: "short", year: "numeric" })
          break
        case "quarterly":
          startDate = startOfQuarter(fromDate)
          endDate = endOfQuarter(toDate)
          increment = 3
          format = (date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
          break
        case "yearly":
          startDate = startOfYear(fromDate)
          endDate = endOfYear(toDate)
          increment = 12
          format = (date) => date.getFullYear().toString()
          break
      }

      for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + increment)) {
        let periodEnd = new Date(date)
        periodEnd.setMonth(periodEnd.getMonth() + increment)
        periodEnd = periodEnd > endDate ? endDate : periodEnd

        const tasksInPeriod = filteredTasks.filter((task) => {
          const taskDate = new Date(task.completed || task.deadline)
          return taskDate >= date && taskDate < periodEnd && task.status === "Completed"
        })

        const avgCompletionTime =
          tasksInPeriod.reduce((sum, task) => sum + (task.completionTime || 0), 0) / tasksInPeriod.length || 0

        data.push({
          name: format(date),
          value: Math.round(avgCompletionTime),
        })
      }

      return data
    }

    const getWeeklyStatusData = (fromDate: Date, toDate: Date) => {
      const data = []
      const startDate = startOfWeek(fromDate)
      const endDate = endOfWeek(toDate)

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
        let periodEnd = new Date(date)
        periodEnd.setDate(periodEnd.getDate() + 7)
        periodEnd = periodEnd > endDate ? endDate : periodEnd

        const tasksInPeriod = filteredTasks.filter((task) => {
          const taskDate = new Date(task.completed || task.deadline)
          return taskDate >= date && taskDate < periodEnd
        })

        const onTime = tasksInPeriod.filter((task) => task.status === "Completed" && task.completionTime <= 100).length
        const missedDeadline = tasksInPeriod.filter(
          (task) => (task.status === "Completed" && task.completionTime > 100) || task.status === "Overdue",
        ).length

        const monthName = date.toLocaleString("default", { month: "short" })
        const weekNumber = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1
        data.push({
          name: `Week ${weekNumber} (${monthName})`,
          onTime,
          missedDeadline,
          startDate: date.toISOString(),
          endDate: periodEnd.toISOString(),
        })
      }

      return data
    }

    const getTaskCompletionStatusData = (timeFrame) => {
      if (timeFrame === "weekly") {
        return getWeeklyStatusData(appliedFilters.fromDate, appliedFilters.toDate)
      }

      const data = []
      const fromDate = appliedFilters.fromDate
      const toDate = appliedFilters.toDate
      let startDate, endDate, increment, format

      switch (timeFrame) {
        case "monthly":
          startDate = startOfMonth(fromDate)
          endDate = endOfMonth(toDate)
          increment = 1
          format = (date) => date.toLocaleString("default", { month: "short", year: "numeric" })
          break
        case "quarterly":
          startDate = startOfQuarter(fromDate)
          endDate = endOfQuarter(toDate)
          increment = 3
          format = (date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
          break
        case "yearly":
          startDate = startOfYear(fromDate)
          endDate = endOfYear(toDate)
          increment = 12
          format = (date) => date.getFullYear().toString()
          break
      }

      for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + increment)) {
        let periodEnd = new Date(date)
        periodEnd.setMonth(periodEnd.getMonth() + increment)
        periodEnd = periodEnd > endDate ? endDate : periodEnd

        const tasksInPeriod = filteredTasks.filter((task) => {
          const taskDate = new Date(task.completed || task.deadline)
          return taskDate >= date && taskDate < periodEnd
        })

        const onTime = tasksInPeriod.filter((task) => task.status === "Completed" && task.completionTime <= 100).length
        const missedDeadline = tasksInPeriod.filter(
          (task) => (task.status === "Completed" && task.completionTime > 100) || task.status === "Overdue",
        ).length

        data.push({
          name: format(date),
          onTime,
          missedDeadline,
        })
      }

      return data
    }

    return {
      completedTasksBreakdown,
      overallTasksBreakdown,
      completionTimingBreakdown,
      averageCompletionTimeData: {
        weekly: getAverageCompletionTimeData("weekly"),
        monthly: getAverageCompletionTimeData("monthly"),
        quarterly: getAverageCompletionTimeData("quarterly"),
        yearly: getAverageCompletionTimeData("yearly"),
      },
      taskCompletionStatusData: {
        weekly: getTaskCompletionStatusData("weekly"),
        monthly: getTaskCompletionStatusData("monthly"),
        quarterly: getTaskCompletionStatusData("quarterly"),
        yearly: getTaskCompletionStatusData("yearly"),
      },
    }
  }, [filteredTasks, stats, appliedFilters])

  const allReceivers = useMemo(() => {
    if (loading) return [];
    return Array.from(new Set(taskData.tasks.map((task) => task.assignedTo)))
  }, [loading]);
  
  const allTaskStatuses = ["Completed", "Pending", "Overdue"];
  const allPriorities = ["High", "Medium", "Low"];

  const handleFilterChange = (key: string, value: any) => {
    setCurrentFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <LoadingOverlay2 isVisible={true} />;
  }

  const handleGenerateReport = () => {
    setAppliedFilters(currentFilters)
    setShowReport(true)
  }

  const handleResetFilters = () => {
    setCurrentFilters({
      taskReceivers: [],
      fromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      toDate: new Date(),
      taskStatus: [],
      priority: [],
    })
  }

  const handleExportStart = () => {
    setIsExporting(true)
    setShowGraphs(true)
  }

  const handleExportEnd = () => {
    setIsExporting(false)
    setTimeFrame(exportTimeFrame)
    setActiveTab(exportTab)
  }

  const handleExportTimeFrameChange = (timeFrame: string) => {
    setTimeFrame(timeFrame as "weekly" | "monthly" | "quarterly" | "yearly")
  }

  const handleExportTabChange = (tab: string) => {
    setActiveTab(tab as "pieCharts" | "lineCharts" | "barCharts")
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">

        <div className="flex-1 flex flex-col overflow-hidden">
          <h1 className="text-5xl font-bold mb-6 p-6">Reports</h1>
          <div className="flex-1 overflow-x-auto">
            <div className="flex-1 p-6 transition-all duration-500 ease-in-out">
              {/* Filter Controls */}
              <div
              className={`bg-[#8B2332] text-white p-4 rounded-md mb-4 sticky top-0 z-10 transition-all duration-300 ease-in-out ${
                isExporting ? "hidden" : ""
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 transition-all duration-300 ease-in-out">
                <div>
                  <label htmlFor="task-receiver" className="block text-sm font-medium mb-1">
                    Task Receiver
                  </label>
                  <Select
                    onValueChange={(value) => {
                      if (value === "all") {
                        handleFilterChange("taskReceivers", allReceivers);
                      } else {
                        handleFilterChange(
                          "taskReceivers",
                          currentFilters.taskReceivers.includes(value)
                            ? currentFilters.taskReceivers.filter((r) => r !== value)
                            : [...currentFilters.taskReceivers, value]
                        );
                      }
                    }}
                    value={currentFilters.taskReceivers.join(",")}
                  >
                    <SelectTrigger id="task-receiver" className="bg-white text-black w-full transition-all duration-300">
                      <SelectValue placeholder="Select Receivers">
                        {currentFilters.taskReceivers.length > 0
                          ? currentFilters.taskReceivers.length === allReceivers.length
                            ? "All Receivers"
                            : currentFilters.taskReceivers.join(", ")
                          : "Select Receivers"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Receivers</SelectItem>
                      {allReceivers.map((receiver) => (
                        <SelectItem key={receiver} value={receiver}>
                          <div className="flex items-center">
                            <Checkbox
                              checked={currentFilters.taskReceivers.includes(receiver)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange("taskReceivers", [...currentFilters.taskReceivers, receiver]);
                                } else {
                                  handleFilterChange(
                                    "taskReceivers",
                                    currentFilters.taskReceivers.filter((r) => r !== receiver)
                                  );
                                }
                              }}
                            />
                            <span className="ml-2">{receiver}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="from-date" className="block text-sm font-medium mb-1">
                    From Date
                  </label>
                  <Input
                    type="date"
                    id="from-date"
                    name="fromDate"
                    value={format(currentFilters.fromDate, "yyyy-MM-dd")}
                    onChange={(e) => handleFilterChange("fromDate", new Date(e.target.value))}
                    className="bg-white text-black w-full transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="to-date" className="block text-sm font-medium mb-1">
                    To Date
                  </label>
                  <Input
                    type="date"
                    id="to-date"
                    name="toDate"
                    value={format(currentFilters.toDate, "yyyy-MM-dd")}
                    onChange={(e) => handleFilterChange("toDate", new Date(e.target.value))}
                    className="bg-white text-black w-full transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="task-status" className="block text-sm font-medium mb-1">
                    Task Status
                  </label>
                  <Select
                    onValueChange={(value) => {
                      if (value === "all") {
                        handleFilterChange("taskStatus", allTaskStatuses);
                      } else {
                        handleFilterChange(
                          "taskStatus",
                          currentFilters.taskStatus.includes(value)
                            ? currentFilters.taskStatus.filter((s) => s !== value)
                            : [...currentFilters.taskStatus, value]
                        );
                      }
                    }}
                    value={currentFilters.taskStatus.join(",")}
                  >
                    <SelectTrigger id="task-status" className="bg-white text-black w-full transition-all duration-300">
                      <SelectValue placeholder="Task Status">
                        {currentFilters.taskStatus.length > 0
                          ? currentFilters.taskStatus.length === allTaskStatuses.length
                            ? "All Task Statuses"
                            : currentFilters.taskStatus.join(", ")
                          : "Task Status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Task Status</SelectItem>
                      {allTaskStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center">
                            <Checkbox
                              checked={currentFilters.taskStatus.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange("taskStatus", [...currentFilters.taskStatus, status]);
                                } else {
                                  handleFilterChange(
                                    "taskStatus",
                                    currentFilters.taskStatus.filter((s) => s !== status)
                                  );
                                }
                              }}
                            />
                            <span className="ml-2">{status}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium mb-1">
                    Priority
                  </label>
                  <Select
                    onValueChange={(value) => {
                      if (value === "all") {
                        handleFilterChange("priority", allPriorities);
                      } else {
                        handleFilterChange(
                          "priority",
                          currentFilters.priority.includes(value)
                            ? currentFilters.priority.filter((p) => p !== value)
                            : [...currentFilters.priority, value]
                        );
                      }
                    }}
                    value={currentFilters.priority.join(",")}
                  >
                    <SelectTrigger id="priority" className="bg-white text-black w-full transition-all duration-300">
                      <SelectValue placeholder="Priority">
                        {currentFilters.priority.length > 0
                          ? currentFilters.priority.length === allPriorities.length
                            ? "All Priorities"
                            : currentFilters.priority.join(", ")
                          : "Priority"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {allPriorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center">
                            <Checkbox
                              checked={currentFilters.priority.includes(priority)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange("priority", [...currentFilters.priority, priority]);
                                } else {
                                  handleFilterChange(
                                    "priority",
                                    currentFilters.priority.filter((p) => p !== priority)
                                  );
                                }
                              }}
                            />
                            <span className="ml-2">{priority}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-start space-x-2 transition-all duration-300">
                <Button className="bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
                <Button className="bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300" onClick={handleGenerateReport}>
                  Generate Report
                </Button>
              </div>
            </div>
            </div>
            <div className=" p-6" ref={reportRef}>
              {showReport && (
                <>
                  {/* User Profile and Stats */}
                    <div className="bg-gray-300 rounded-md p-4 mb-6 transition-all duration-500 ease-in-out">
                    <div className="flex flex-wrap">
                      {/* User Info and Filters */}
                      <div className="flex-1">
                      <div className="grid grid-cols-[auto,1fr] items-center">
                        {/* Avatar */}
                        <div className="">


                        {/* Action Buttons for small screens */}
                        <div className="mt-4 flex flex-col gap-2 lg:hidden">
                          <Button
                          className="bg-gray-500 hover:bg-gray-600 text-white"
                          onClick={() => setShowGraphs(!showGraphs)}
                          >
                          {showGraphs ? "Hide Graphs" : "View Graphs"}
                          </Button>
                          <ExportToPdfButton
                          reportRef={reportRef}
                          fromDate={appliedFilters.fromDate}
                          toDate={appliedFilters.toDate}
                          onExportStart={handleExportStart}
                          onExportEnd={handleExportEnd}
                          timeFrames={["weekly", "monthly", "quarterly", "yearly"]}
                          onTimeFrameChange={handleExportTimeFrameChange}
                          onTabChange={handleExportTabChange}
                          />
                        </div>
                        </div>

                        {/* Filters and Buttons */}
                        <div className="">
                          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-5 gap-x-4 gap-y-6 lg:gap-y-3 p-4 transition-all duration-500 ease-in-out">
                          <Button className="bg-[#8B2332] text-white rounded-md">
                            {appliedFilters.taskReceivers.length === allReceivers.length 
                              ? "All Receivers"
                              : appliedFilters.taskReceivers.join(", ")}
                          </Button>
                            <Button className="bg-[#8B2332] text-white rounded-md">
                            {`${format(appliedFilters.fromDate, "MM/dd/yyyy")} - ${format(appliedFilters.toDate, "MM/dd/yyyy")}`}
                            </Button>
                            <Button className="bg-[#8B2332] text-white rounded-md">
                            {appliedFilters.taskStatus.length === allTaskStatuses.length
                            ? "All Task Status"
                            : appliedFilters.taskStatus.join(", ")}
                            </Button>
                            <Button className="bg-[#8B2332] text-white rounded-md">
                            {appliedFilters.priority.length === allPriorities.length
                            ? "All Priorities"
                            : appliedFilters.priority.join(", ")}
                            </Button>

                          {/* Action Buttons for medium and larger screens */}
                          <div className="hidden lg:grid grid-cols-2 gap-x-4 gap-y-4">
                          <Button
                            className="bg-gray-500 hover:bg-gray-600 text-white"
                            onClick={() => setShowGraphs(!showGraphs)}
                          >
                            {showGraphs ? "Hide Graphs" : "View Graphs"}
                          </Button>
                          <ExportToPdfButton
                            reportRef={reportRef}
                            fromDate={appliedFilters.fromDate}
                            toDate={appliedFilters.toDate}
                            onExportStart={handleExportStart}
                            onExportEnd={handleExportEnd}
                            timeFrames={["weekly", "monthly", "quarterly", "yearly"]}
                            onTimeFrameChange={handleExportTimeFrameChange}
                            onTabChange={handleExportTabChange}
                          />
                          </div>
                        </div>
                        <div className="hidden 2xl:grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-16 gap-y-1 p-4 transition-all duration-500 ease-in-out">
                          <div className="flex justify-between">
                          <span className="font-semibold">Number of tasks Assigned:</span>
                          <span>{stats.tasksAssigned}</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Tasks Completed Late:</span>
                          <span>{stats.completedLate.toString().padStart(2, "0")}</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Completed Tasks:</span>
                          <span>{stats.completedTasks}</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Tasks Not Completed:</span>
                          <span>{stats.notCompleted.toString().padStart(2, "0")}</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Pending Tasks:</span>
                          <span>{stats.pendingTasks.toString().padStart(2, "0")}</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Average Completion Time:</span>
                          <span>{stats.avgCompletionTime}%</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Overdue Tasks:</span>
                          <span>{stats.overdueTasks.toString().padStart(2, "0")}</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Average Completion Rate:</span>
                          <span>{stats.avgCompletionRate}%</span>
                          </div>
                          <div className="flex justify-between">
                          <span className="font-semibold">Tasks Completed on time:</span>
                          <span>{stats.completedOnTime}</span>
                          </div>

                        </div>
                        </div>
                      </div>

                      {/* Stats Grid for large screen */}
                      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-x-16 gap-y-1 p-4 2xl:hidden transition-all duration-500 ease-in-out">
                        <div className="flex justify-between">
                        <span className="font-semibold">Number of tasks Assigned:</span>
                        <span>{stats.tasksAssigned}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Tasks Completed Late:</span>
                        <span>{stats.completedLate.toString().padStart(2, "0")}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Completed Tasks:</span>
                        <span>{stats.completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Tasks Not Completed:</span>
                        <span>{stats.notCompleted.toString().padStart(2, "0")}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Pending Tasks:</span>
                        <span>{stats.pendingTasks.toString().padStart(2, "0")}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Average Completion Time:</span>
                        <span>{stats.avgCompletionTime}%</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Overdue Tasks:</span>
                        <span>{stats.overdueTasks.toString().padStart(2, "0")}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Average Completion Rate:</span>
                        <span>{stats.avgCompletionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="font-semibold">Tasks Completed on time:</span>
                        <span>{stats.completedOnTime}</span>
                        </div>

                      </div>
                      </div>
                    </div>
                    </div>

                  {/* Charts Section */}
                  {showGraphs && (
                    <TooltipProvider>
                      <div className=" mx-auto">
                        {/* Chart Navigation */}
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex space-x-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Button
                              variant={activeTab === "pieCharts" ? "default" : "outline"}
                              onClick={() => setActiveTab("pieCharts")}
                              className={activeTab === "pieCharts" ? "bg-[#8B2332]" : ""}
                            >
                              Pie Charts
                            </Button>
                            <Button
                              variant={activeTab === "lineCharts" ? "default" : "outline"}
                              onClick={() => setActiveTab("lineCharts")}
                              className={activeTab === "lineCharts" ? "bg-[#8B2332]" : ""}
                            >
                              Line Charts
                            </Button>
                            <Button
                              variant={activeTab === "barCharts" ? "default" : "outline"}
                              onClick={() => setActiveTab("barCharts")}
                              className={activeTab === "barCharts" ? "bg-[#8B2332]" : ""}
                            >
                              Bar Charts
                            </Button>
                          </div>

                            {(activeTab === "lineCharts" || activeTab === "barCharts") && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Button
                              variant={timeFrame === "weekly" ? "default" : "outline"}
                              onClick={() => setTimeFrame("weekly")}
                              className={timeFrame === "weekly" ? "bg-[#8B2332]" : ""}
                              size="sm"
                              >
                              Weekly
                              </Button>
                              <Button
                              variant={timeFrame === "monthly" ? "default" : "outline"}
                              onClick={() => setTimeFrame("monthly")}
                              className={timeFrame === "monthly" ? "bg-[#8B2332]" : ""}
                              size="sm"
                              >
                              Monthly
                              </Button>
                              <Button
                              variant={timeFrame === "quarterly" ? "default" : "outline"}
                              onClick={() => setTimeFrame("quarterly")}
                              className={timeFrame === "quarterly" ? "bg-[#8B2332]" : ""}
                              size="sm"
                              >
                              Quarterly
                              </Button>
                              <Button
                              variant={timeFrame === "yearly" ? "default" : "outline"}
                              onClick={() => setTimeFrame("yearly")}
                              className={timeFrame === "yearly" ? "bg-[#8B2332]" : ""}
                              size="sm"
                              >
                              Yearly
                              </Button>
                            </div>
                            )}
                          </div>

                        {/* Pie Charts */}
                        {activeTab === "pieCharts" && (
                          <div className="max-w-[1600px] mx-auto" data-tab="pieCharts">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              {/* Completed Tasks Breakdown */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Completed Tasks Breakdown</h3>
                                <TaskCompletionPieChart
                                  data={chartData.completedTasksBreakdown}
                                  title="On Time"
                                  subtitle1="Late"
                                  subtitle2="Not Completed"
                                />
                              </div>

                              {/* Overall Tasks Breakdown */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Overall Tasks Breakdown</h3>
                                <TaskCompletionPieChart
                                  data={chartData.overallTasksBreakdown}
                                  title="Completed"
                                  subtitle1="Pending"
                                  subtitle2="Overdue"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">

                              {/* Completion Timing Breakdown */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Completion Timing Breakdown</h3>
                                <TaskCompletionPieChart
                                  data={chartData.completionTimingBreakdown}
                                  title="Early (≤30%)"
                                  subtitle1="Normal (31-60%)"
                                  subtitle2="Near/On Deadline (>60%)"
                                  isQuadChart={true}
                                />
                              </div>
                            </div>

                            {/* Progress Bars */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div>
                                <ProgressBar
                                  percentage={stats.avgCompletionTime}
                                  label={`Average Completion Time is ${stats.avgCompletionTime}% of the time between task assignment and deadline`}
                                  color="#8B2332"
                                />
                              </div>
                              <div>
                                <ProgressBar
                                  percentage={stats.avgCompletionRate}
                                  label={`Average Completion Rate is ${stats.avgCompletionRate}%`}
                                  color="#8B2332"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Line Charts */}
                        {activeTab === "lineCharts" && (
                          <div className="max-w-[1600px] mx-auto" data-tab="lineCharts">
                            <h3 className="text-xl font-semibold mb-4">Average Time Completion ({timeFrame})</h3>
                            <AverageCompletionTimeChart data={chartData.averageCompletionTimeData[timeFrame]}>
                              <Tooltip
                                formatter={(value) => [`${value}%`, "Avg. Completion Time"]}
                                labelFormatter={(label, payload) => {
                                  if (payload && payload[0] && payload[0].payload) {
                                    const { startDate, endDate } = payload[0].payload
                                    return `${format(new Date(startDate), "MMM d, yyyy")} - ${format(new Date(endDate), "MMM d, yyyy")}`
                                  }
                                  return label
                                }}
                              />
                            </AverageCompletionTimeChart>
                          </div>
                        )}

                        {/* Bar Charts */}
                        {activeTab === "barCharts" && (
                          <div className="max-w-[1600px] mx-auto" data-tab="barCharts">
                            <h3 className="text-xl font-semibold mb-4">Task Completion Status ({timeFrame})</h3>
                            <TaskCompletionStatusChart data={chartData.taskCompletionStatusData[timeFrame]}>
                              <Tooltip
                                formatter={(value, name) => [
                                  value,
                                  name === '                                  name === "onTime'
                                    ? "Completed On/Before Time"
                                    : "Missed Deadline",
                                ]}
                                labelFormatter={(label, payload) => {
                                  if (payload && payload[0] && payload[0].payload) {
                                    const { startDate, endDate } = payload[0].payload
                                    return `${format(new Date(startDate), "MMM d, yyyy")} - ${format(new Date(endDate), "MMM d, yyyy")}`
                                  }
                                  return label
                                }}
                              />
                            </TaskCompletionStatusChart>
                          </div>
                        )}
                      </div>
                    </TooltipProvider>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <LoadingOverlay isVisible={isExporting} />
    </>
  )
}

