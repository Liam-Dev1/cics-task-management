"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import TaskManagement from "./admintaskview"
import TasksPage from "./usertaskview"

export default function TaskPage() {
  const [user, loading, error] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
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
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Show loading state while authentication or role is being determined
  if (loading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332] mb-4"></div>
        <div className="text-xl ml-3">Loading...</div>
      </div>
    )
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (!user) {
    return <div>You must be logged in to access this page.</div>
  }

  // Only render the appropriate view when we know the user's role
  return <div>{userRole === "admin" || userRole === "super admin" ? <TaskManagement /> : <TasksPage />}</div>
}

