"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Sidebar as AdminSidebar } from "@/components/sidebar-admin"
import { Sidebar as UserSidebar } from "@/components/sidebar-user"

// Import the wrapper components from the same directory
import AdminTaskViewWrapper from "./admintaskview"
import UserTaskViewWrapper from "./usertaskview"

export default function TaskPage() {
  const [user, loading] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const taskId = searchParams.get("taskId")
  const filterParam = searchParams.get("filter")

  // Fetch the user's role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.email) {
        setIsRoleLoading(true)
        try {
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("email", "==", user.email))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data()
            setUserRole(userData.role)
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
        } finally {
          setIsRoleLoading(false)
        }
      } else if (!loading) {
        setIsRoleLoading(false)
      }
    }

    fetchUserRole()
  }, [user, loading])

  useEffect(() => {
    // Set up the onAuthStateChanged observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      }
    })

    // Clean up the observer when the component unmounts
    return () => unsubscribe()
  }, [router])

  // Handle task ID scrolling
  useEffect(() => {
    if (taskId) {
      // Find and scroll to the task element
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${taskId}`)
        if (taskElement) {
          // Scroll to the task
          taskElement.scrollIntoView({ behavior: "smooth", block: "center" })

          // Add highlight class
          taskElement.classList.add("highlight-task")

          // Remove highlight class after 2 seconds
          setTimeout(() => {
            taskElement.classList.remove("highlight-task")
          }, 2000)
        }
      }, 500) // Give it time to render
    }
  }, [taskId, userRole])

  // Add a useEffect to handle URL search parameters for task search
  useEffect(() => {
    // Check if there's a search parameter in the URL
    const searchParam = searchParams.get("search")
    if (searchParam && userRole) {
      // Find the task element by search term
      const taskElements = document.querySelectorAll('[id^="task-"]')

      for (const element of taskElements) {
        const taskText = element.textContent?.toLowerCase() || ""
        if (taskText.includes(searchParam.toLowerCase())) {
          // Scroll to the first matching task
          element.scrollIntoView({ behavior: "smooth", block: "center" })

          // Highlight the task briefly
          element.classList.add("ring-2", "ring-[#8B2332]", "ring-opacity-70")
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-[#8B2332]", "ring-opacity-70")
          }, 2000)

          break
        }
      }
    }
  }, [searchParams, userRole])

  // Add a useEffect to handle URL filter parameters
  useEffect(() => {
    // Check if there's a filter parameter in the URL
    const filterParam = searchParams.get("filter")
    if (filterParam) {
      // Store the filter in localStorage so task views can access it
      localStorage.setItem("activeTaskFilter", filterParam)
    }
  }, [searchParams])

  // Handle sidebar minimize/maximize
  const handleSidebarMinimize = (minimized: boolean) => {
    setIsSidebarMinimized(minimized)
  }

  // If not logged in, redirect to login
  if (!loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">You must be logged in to access this page.</div>
      </div>
    )
  }

  // Determine which sidebar to show based on user role
  const SidebarComponent = userRole === "admin" || userRole === "super admin" ? AdminSidebar : UserSidebar

  return (
    <div className="flex min-h-screen">
      {/* Sidebar with onMinimize prop */}
      <SidebarComponent onMinimize={handleSidebarMinimize} />

      {/* Main content area with dynamic margin based on sidebar state */}
      <div
        className="flex-1 transition-all duration-300"
        style={{
          marginLeft: isSidebarMinimized ? "4rem" : "16rem",
        }}
      >
        {loading || isRoleLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332] mb-4"></div>
            <div className="text-xl ml-3">Loading tasks...</div>
          </div>
        ) : (
          <>{userRole === "admin" || userRole === "super admin" ? <AdminTaskViewWrapper /> : <UserTaskViewWrapper />}</>
        )}
      </div>
    </div>
  )
}

