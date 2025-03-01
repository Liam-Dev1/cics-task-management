"use client"

import { useState, useMemo } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
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
import { taskData } from "@/lib/sample-data"
import { Sidebar } from "@/components/sidebar"

export default function TaskReportDashboard() {
  const [timeFrame, setTimeFrame] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly")
  const [activeTab, setActiveTab] = useState<"pieCharts" | "lineCharts" | "barCharts">("pieCharts")
  const [showGraphs, setShowGraphs] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const [currentFilters, setCurrentFilters] = useState({
    taskReceiver: "all",
    fromDate: new Date(2024, 0, 1),
    toDate: new Date(2024, 9, 10),
    taskStatus: "all",
    priority: "all",
  })
  const [appliedFilters, setAppliedFilters] = useState(currentFilters)

  const handleFilterChange = (key: string, value: any) => {
    setCurrentFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerateReport = () => {
    setAppliedFilters(currentFilters)
    setShowReport(true)
  }

  const filteredTasks = useMemo(() => {
    return taskData.tasks.filter((task) => {
      const matchesReceiver = appliedFilters.taskReceiver === "all" || task.assignedTo === appliedFilters.taskReceiver
      const matchesStatus =
        appliedFilters.taskStatus === "all" || task.status.toLowerCase() === appliedFilters.taskStatus.toLowerCase()
      const matchesPriority =
        appliedFilters.priority === "all" || task.priority.toLowerCase() === appliedFilters.priority.toLowerCase()
      const taskDate = new Date(task.assignedDate)
      const isWithinDateRange =
        (!appliedFilters.fromDate || taskDate >= appliedFilters.fromDate) &&
        (!appliedFilters.toDate || taskDate <= appliedFilters.toDate)
      return matchesReceiver && matchesStatus && matchesPriority && isWithinDateRange
    })
  }, [appliedFilters])

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
    const reopenedTasks = filteredTasks.filter((task) => task.reopened).length
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
      reopenedTasks,
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

    const taskReopenedPercentage = [
      { name: "Reopened", value: stats.reopenedTasks, color: "#8B2332" },
      { name: "Not Reopened", value: stats.tasksAssigned - stats.reopenedTasks, color: "#4A5568" },
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
          const taskDate = new Date(task.completionDate || task.dueDate)
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
          const taskDate = new Date(task.completionDate || task.dueDate)
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
          const taskDate = new Date(task.completionDate || task.dueDate)
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
          const taskDate = new Date(task.completionDate || task.dueDate)
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
      taskReopenedPercentage,
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

  return (
    <>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <h1 className="text-5xl font-bold mb-6">Reports</h1>

          {/* Filter Controls */}
          <div className="bg-[#8B2332] text-white p-4 rounded-md mb-4">
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label htmlFor="task-receiver" className="block text-sm font-medium mb-1">
                  Task Receiver
                </label>
                <Select
                  onValueChange={(value) => handleFilterChange("taskReceiver", value)}
                  value={currentFilters.taskReceiver}
                >
                  <SelectTrigger id="task-receiver" className="bg-white text-black w-full">
                    <SelectValue placeholder="Task Receiver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Receivers</SelectItem>
                    <SelectItem value="John Smith">John Smith</SelectItem>
                    <SelectItem value="Jane Doe">Jane Doe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="from-date" className="block text-sm font-medium mb-1">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="from-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white text-black"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {currentFilters.fromDate ? format(currentFilters.fromDate, "PPP") : <span>From</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={currentFilters.fromDate}
                      onSelect={(date) => handleFilterChange("fromDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label htmlFor="to-date" className="block text-sm font-medium mb-1">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="to-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white text-black"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {currentFilters.toDate ? format(currentFilters.toDate, "PPP") : <span>To</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={currentFilters.toDate}
                      onSelect={(date) => handleFilterChange("toDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label htmlFor="task-status" className="block text-sm font-medium mb-1">
                  Task Status
                </label>
                <Select
                  onValueChange={(value) => handleFilterChange("taskStatus", value)}
                  value={currentFilters.taskStatus}
                >
                  <SelectTrigger id="task-status" className="bg-white text-black w-full">
                    <SelectValue placeholder="Task Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Task Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <Select
                  onValueChange={(value) => handleFilterChange("priority", value)}
                  value={currentFilters.priority}
                >
                  <SelectTrigger id="priority" className="bg-white text-black w-full">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button className="bg-gray-700 hover:bg-gray-600 text-white" onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </div>
          </div>

          {showReport && (
            <>
              {/* User Profile and Stats */}
              <div className="bg-gray-300 rounded-md p-4 mb-6">
                <div className="flex">
                  {/* User Avatar */}
                  <div className="mr-4">
                    <div className="w-32 h-32 bg-gray-500 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-[#4A5568] flex items-center justify-center">
                        {/* Silhouette placeholder */}
                      </div>
                    </div>
                  </div>

                  {/* User Info and Filters */}
                  <div className="flex-1">
                    <div className="flex gap-2 mb-4">
                      <Button className="bg-[#8B2332] text-white rounded-md">
                        {appliedFilters.taskReceiver === "all" ? "All Receivers" : appliedFilters.taskReceiver}
                      </Button>
                      <Button className="bg-[#8B2332] text-white rounded-md">{`${format(appliedFilters.fromDate, "PPP")} - ${format(appliedFilters.toDate, "PPP")}`}</Button>
                      <Button className="bg-[#8B2332] text-white rounded-md">
                        {appliedFilters.taskStatus === "all" ? "All Task Status" : appliedFilters.taskStatus}
                      </Button>
                      <Button className="bg-[#8B2332] text-white rounded-md">
                        {appliedFilters.priority === "all" ? "All Priorities" : appliedFilters.priority}
                      </Button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-x-16 gap-y-1">
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
                      <div className="flex justify-between">
                        <span className="font-semibold">Reopened Tasks:</span>
                        <span>{stats.reopenedTasks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                      onClick={() => setShowGraphs(!showGraphs)}
                    >
                      {showGraphs ? "Hide Graphs" : "View Graphs"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              {showGraphs && (
                <TooltipProvider>
                  <div className="bg-gray-200 rounded-md p-4">
                    {/* Chart Navigation */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex space-x-2">
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
                        <div className="flex space-x-2">
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
                      <div>
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
                          {/* Tasks Reopened Percentage */}
                          <div>
                            <h3 className="text-lg font-semibold mb-2 text-center">Tasks Reopened Percentage</h3>
                            <TaskCompletionPieChart
                              data={chartData.taskReopenedPercentage}
                              title="Reopened"
                              subtitle1="Not Reopened"
                              subtitle2=""
                            />
                          </div>

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
                      <div>
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
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Task Completion Status ({timeFrame})</h3>
                        <TaskCompletionStatusChart data={chartData.taskCompletionStatusData[timeFrame]}>
                          <Tooltip
                            formatter={(value, name) => [
                              value,
                              name === "onTime" ? "Completed On/Before Time" : "Missed Deadline",
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
    </>
  )
}

