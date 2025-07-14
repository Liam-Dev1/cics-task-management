"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface ProfileProps {
  users: any[]
  userName: string | null
  userEmail: string | null
  userRole: string | null
  profilePhoto: string | null
  isAdminMode: boolean
  setIsAdminMode: () => void
}

export default function ProfileAdmin({
  users,
  userName,
  userEmail,
  userRole,
  profilePhoto: initialProfilePhoto,
  isAdminMode,
  setIsAdminMode,
}: ProfileProps) {
  const router = useRouter()

  // Determine the display role based on admin mode state
  const displayRole = userRole
    ? isAdminMode
      ? userRole === "super admin" 
        ? "Super Admin"
        : userRole
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
      : "Task Receiver (Admin)"
    : "Admin"

  // Redirect to appropriate page when mode changes
  useEffect(() => {
    // Get the current path
    const currentPath = window.location.pathname

    // Check if we're on an admin-only page while in user mode
    if (!isAdminMode && (currentPath.includes("/receiver") || currentPath.includes("/reports"))) {
      router.push("/dashboard")
    }
  }, [isAdminMode, router])

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      <div className="flex items-baseline gap-4 mb-4">
        <h1 className="text-5xl font-bold text-[#333333]">User Profile</h1>
        {isAdminMode && <span className="text-4xl font-bold text-[#8B2332]">
          {userRole === "super admin" ? "Super Admin" : "Admin"}
        </span>}
      </div>

      <div className="p-3 m-5">
        <div className="flex items-center">
          <div className="pr-1">
            <img
              src={initialProfilePhoto || "https://placehold.co/200"}
              className="rounded-full border border-white w-40 h-40 object-cover"
              alt="Profile"
            />
          </div>
          <div className="pl-5">
            <span className="text-4xl font-bold text-[#8B2332]">{userName}</span>
            <h1 className="text-5xl font-bold text-[#333333]">{displayRole}</h1>
            <h5 className="text-xl font-bold">{userEmail}</h5>
          </div>
        </div>

        <div className="p-6 flex flex-col sm:flex-row gap-4">
          <Button
            className="w-64 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center justify-center"
            onClick={setIsAdminMode}
          >
            {isAdminMode ? "Switch to Task Receiver View" : "Switch to Admin View"}
          </Button>
        </div>
      </div>
    </div>
  )
}