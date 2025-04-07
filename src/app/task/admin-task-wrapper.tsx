"use client";

import { useEffect } from "react";
import AdminTaskView from "./admintaskview";

interface AdminTaskWrapperProps {
  taskId: string | null;
}

export default function AdminTaskWrapper({ taskId }: AdminTaskWrapperProps) {
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

  return <AdminTaskView />;
}
