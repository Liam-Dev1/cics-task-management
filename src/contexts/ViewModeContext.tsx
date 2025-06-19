"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth, db } from "@/lib/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"

type ViewModeContextType = {
  isAdminMode: boolean
  toggleAdminMode: () => void
  userRole: string | null
  setUserRole: (role: string | null) => void
  isRoleLoading: boolean
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export const useViewMode = () => {
  const context = useContext(ViewModeContext)
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider")
  }
  return context
}

type ViewModeProviderProps = {
  children: ReactNode
}

export const ViewModeProvider = ({ children }: ViewModeProviderProps) => {
  const [isAdminMode, setIsAdminMode] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const [user] = useAuthState(auth)

  // Monitor user role changes in real-time
  useEffect(() => {
    const monitorUserRole = async () => {
      if (!user?.email) {
        setUserRole(null)
        setIsRoleLoading(false)
        return
      }

      try {
        setIsRoleLoading(true)
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", user.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          const newRole = userData.role || "user"

          // Check if role has changed
          if (userRole && userRole !== newRole) {
            console.log(`User role changed from ${userRole} to ${newRole}`)

            // Automatically adjust view mode based on new role
            if (newRole === "admin" || newRole === "super admin") {
              setIsAdminMode(true)
            } else {
              setIsAdminMode(false)
            }

            // Clear any cached data that might be role-specific
            if (typeof window !== "undefined") {
              localStorage.removeItem("expandedTasks")
              localStorage.removeItem("activeTaskFilter")
            }
          }

          setUserRole(newRole)
        } else {
          setUserRole("user") // Default role if not found
        }
      } catch (error) {
        console.error("Error monitoring user role:", error)
        setUserRole("user") // Fallback to user role
      } finally {
        setIsRoleLoading(false)
      }
    }

    // Initial role fetch
    monitorUserRole()

    // Set up periodic role checking (every 30 seconds)
    const roleCheckInterval = setInterval(monitorUserRole, 30000)

    return () => {
      clearInterval(roleCheckInterval)
    }
  }, [user, userRole])

  // Load the admin mode from session storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMode = sessionStorage.getItem("adminViewMode")
      if (storedMode) {
        setIsAdminMode(storedMode === "admin")
      }
    }
  }, [])

  // Update session storage when admin mode changes
  useEffect(() => {
    if (userRole === "admin" || userRole === "super admin") {
      sessionStorage.setItem("adminViewMode", isAdminMode ? "admin" : "user")
    }
  }, [isAdminMode, userRole])

  const toggleAdminMode = () => {
    // Only allow toggle if user has admin privileges
    if (userRole === "admin" || userRole === "super admin") {
      setIsAdminMode((prev) => !prev)
    }
  }

  return (
    <ViewModeContext.Provider
      value={{
        isAdminMode,
        toggleAdminMode,
        userRole,
        setUserRole,
        isRoleLoading,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  )
}
