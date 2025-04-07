"use client";

import { useEffect } from "react";
import UserTaskView from "./usertaskview";

interface UserTaskWrapperProps {
  taskId: string | null;
}

export default function UserTaskWrapper({ taskId }: UserTaskWrapperProps) {
  useEffect(() => {
    if (taskId) {
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: "smooth", block: "center" });

          // Add the glow effect
          taskElement.classList.add("glow");
          setTimeout(() => {
            taskElement.classList.remove("glow");
          }, 2000); // Remove the glow after 2 seconds
        }
      }, 500); // Give it time to render
    }
  }, [taskId]);

  return <UserTaskView />;
}
