"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import AdminView from "./admintaskview"
import UserView from "./usertaskview"

export default function TaskPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

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
      {user.role === "admin" || "super admin" ? (
        <AdminView />
      ) : (
        <UserView />
      )}
    </div>
  )
}