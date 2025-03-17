"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import TaskManagement from "./admintaskview"
import TasksPage from "./usertaskview"
import { Sidebar } from "@/components/sidebar-admin"

export default function TaskPage() {
  const [user, loading] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  // Fetch the user's role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.email) {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", user.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          setUserRole(userData.role)
        }
      }
    }

    fetchUserRole()
  }, [user])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>You must be logged in to access this page.</div>
  }

  // Render the appropriate view based on the user's role
  return (
    <div>
      {userRole === "admin" || userRole === "super admin" ? (
        <TaskManagement />
      ) : (
        <TasksPage />
      )}
    </div>
  )
}