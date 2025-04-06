"use client"

import { useEffect } from "react"
import UserTaskView from "./usertaskview"

interface UserTaskWrapperProps {
  taskId: string | null
}

export default function UserTaskWrapper({ taskId }: UserTaskWrapperProps) {
  useEffect(() => {
    if (taskId) {
      // Find and scroll to the task element
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${taskId}`)
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: "smooth", block: "center" })
          taskElement.classList.add("ring-2", "ring-[#8B2332]", "ring-opacity-70")
          setTimeout(() => {
            taskElement.classList.remove("ring-2", "ring-[#8B2332]", "ring-opacity-70")
          }, 2000)
        }
      }, 500) // Give it time to render
    }
  }, [taskId])

  return <UserTaskView />
}

