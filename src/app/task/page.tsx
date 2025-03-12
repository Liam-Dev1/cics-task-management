"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"
import AdminView from "./admintaskview"
import UserView from "./usertaskview"

export default function TaskPage() {
  const [user, loading] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const router = useRouter()

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Fetch user role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role)
          } else {
            setUserRole("user") // Default role
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
          setUserRole("user") // Default to user role on error
        } finally {
          setRoleLoading(false)
        }
      }
    }

    if (user) {
      fetchUserRole()
    }
  }, [user])

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-muted rounded-lg shadow-md">
          <p className="text-lg">You must be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  // Render the appropriate view based on the user's role
  return <div>{userRole === "admin" || userRole === "super admin" ? <AdminView /> : <UserView />}</div>
}

