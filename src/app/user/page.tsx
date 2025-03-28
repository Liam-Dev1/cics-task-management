"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import ProfileAdmin from "./profile_admin"
import ProfileUser from "./profile_user"
import { Sidebar as AdminSidebar } from "@/components/sidebar-admin"
import { Sidebar as UserSidebar } from "@/components/sidebar-user"

// Define the user type
type UserData = {
  id: string
  name?: string
  email?: string
  role?: string
  profilePhoto?: string
  [key: string]: any
}

export default function UserPage() {
  const [user, loading] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const [userData, setUserData] = useState({
    users: [] as UserData[],
    userName: "",
    userEmail: "",
    userRole: "",
    profilePhoto: "",
  })
  const router = useRouter()

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

  // Fetch the user's role and data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        setIsRoleLoading(true)
        try {
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("email", "==", user.email))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const data = userDoc.data()
            setUserRole(data.role)

            // Get all users for admin view
            const allUsersSnapshot = await getDocs(collection(db, "users"))
            const allUsers = allUsersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as UserData[]

            setUserData({
              users: allUsers,
              userName: user.displayName || "",
              userEmail: user.email || "",
              userRole: data.role || "",
              profilePhoto: data.profilePhoto || "",
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setIsRoleLoading(false)
        }
      } else if (!loading) {
        setIsRoleLoading(false)
      }
    }

    fetchUserData()
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
            <div className="text-xl ml-3">Loading profile...</div>
          </div>
        ) : (
          <>
            {userRole === "admin" || userRole === "super admin" ? (
              <ProfileAdmin
                users={userData.users}
                userName={userData.userName}
                userEmail={userData.userEmail}
                userRole={userData.userRole}
                profilePhoto={userData.profilePhoto}
              />
            ) : (
              <ProfileUser
                users={userData.users}
                userName={userData.userName}
                userEmail={userData.userEmail}
                userRole={userData.userRole}
                profilePhoto={userData.profilePhoto}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

