"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import AdminView from "./admin-view"
import UserView from "./user-view"

export default function HelpAndSupport() {
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
        } else {
          // Default to "user" if no role is found
          setUserRole("user")
        }
      }
    }

    if (user) {
      fetchUserRole()
    }
  }, [user])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">You must be logged in to access this page.</div>
      </div>
    )
  }

  // Render the appropriate view based on the user's role
  const isAdmin = userRole === "admin" || userRole === "super admin"

  return isAdmin ? <AdminView /> : <UserView />
}

