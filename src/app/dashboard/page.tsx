"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import AdminDashboard from "./admin_dashboard"
import UserDashboard from "./user_dashboard"
import { Sidebar as AdminSidebar } from "@/components/sidebar-admin"
import { Sidebar as UserSidebar } from "@/components/sidebar-user"

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const [adminViewMode, setAdminViewMode] = useState<string | null>(null)
  const router = useRouter()

  // Check if admin is using receiver mode from session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMode = sessionStorage.getItem("adminViewMode")
      setAdminViewMode(storedMode)
    }
  }, [])

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

  // Check if sidebar should be minimized based on orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== "undefined") {
        const isPortrait = window.matchMedia("(orientation: portrait)").matches
        setIsSidebarMinimized(isPortrait)
      }
    }

    // Initial check
    checkOrientation()

    // Set up listener for orientation changes
    const mediaQuery = window.matchMedia("(orientation: portrait)")
    const handleOrientationChange = () => checkOrientation()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleOrientationChange)
    } else {
      window.addEventListener("resize", handleOrientationChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleOrientationChange)
      } else {
        window.removeEventListener("resize", handleOrientationChange)
      }
    }
  }, [])

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // If not logged in, redirect to login
  if (!loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">You must be logged in to access this page.</div>
      </div>
    )
  }

  // Determine which view to show based on user role and admin mode
  const isAdmin = (userRole === "admin" || userRole === "super admin")
  const shouldShowAdminView = isAdmin && adminViewMode !== 'user'
  
  // Determine which sidebar to show based on current view mode
  const SidebarComponent = shouldShowAdminView ? AdminSidebar : UserSidebar

  return (
    <div className="flex min-h-screen">
      {/* Sidebar with onMinimize prop */}
      <SidebarComponent onMinimize={setIsSidebarMinimized} />

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
            <div className="text-xl ml-3">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {shouldShowAdminView ? (
              <AdminDashboard />
            ) : (
              <UserDashboard />
            )}
          </>
        )}
      </div>
    </div>
  )
}

