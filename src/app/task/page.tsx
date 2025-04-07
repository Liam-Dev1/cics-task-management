import { Suspense } from "react"
import TaskPageClient from "./task-page-client"

export default function TaskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332] mb-4"></div>
          <div className="text-xl ml-3">Loading tasks...</div>
        </div>
      }
    >
      <TaskPageClient />
    </Suspense>
  )
}
