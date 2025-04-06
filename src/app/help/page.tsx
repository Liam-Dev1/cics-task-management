"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import AdminView from "./admin-view"
import UserView from "./user-view"
import { Sidebar as AdminSidebar } from "@/components/sidebar-admin"
import { Sidebar as UserSidebar } from "@/components/sidebar-user"

export default function HelpPage() {
  const [user, loading] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const router = useRouter()

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
      {/* Sidebar is always visible */}
      <SidebarComponent onMinimize={setIsSidebarMinimized} />

      {/* Main content area with proper margin to account for fixed sidebar */}
      <div className="flex-1 transition-all duration-300" style={{ marginLeft: isSidebarMinimized ? "4rem" : "16rem" }}>
        {loading || isRoleLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332] mb-4"></div>
            <div className="text-xl ml-3">Loading help...</div>
          </div>
        ) : (
          <>{userRole === "admin" || userRole === "super admin" ? <AdminView /> : <UserView />}</>
        )}
      </div>
    </div>
  )
}

