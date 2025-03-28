"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import AdminProfile from "./profile_admin"
import UserProfile from "./profile_user"

export default function UserProfilePage() {
  const [user, loading] = useAuthState(auth)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const router = useRouter()

  // Fetch the user's role, name, email, and profile photo from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        setIsRoleLoading(true)
        try {
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("email", "==", user.email))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data()
            setUserRole(capitalizeRole(userData.role))
            setUserName(userData.name)
            setUserEmail(userData.email)
            setProfilePhoto(userData.profilePhoto)
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

  // Redirect if not logged in
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">You must be logged in to access this page.</div>
      </div>
    )
  }

  // Only render the appropriate profile when we know the user's role
  return (
    <div>
      {userRole === "Admin" || userRole === "Super Admin" ? (
        <AdminProfile
          users={[]}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          profilePhoto={profilePhoto}
        />
      ) : (
        <UserProfile
          users={[]}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          profilePhoto={profilePhoto}
        />
      )}
    </div>
  )
}

// Helper function to capitalize the first letter of each word in the role
function capitalizeRole(role: string) {
  return role
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

