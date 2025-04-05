"use client"

import { Sidebar } from "@/components/sidebar-admin"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface ProfileProps {
  users: any[]
  userName: string | null
  userEmail: string | null
  userRole: string | null
  profilePhoto: string | null
}

export default function Profile({ users, userName, userEmail, userRole, profilePhoto }: ProfileProps) {
  // Get the stored role mode from sessionStorage on initial load
  const [isAdmin, setIsAdmin] = useState(true) // Default to true, will be updated in useEffect
  const [displayedRole, setDisplayedRole] = useState(userRole)
  
  // Initialize states from sessionStorage on component mount
  useEffect(() => {
    const storedIsAdmin = sessionStorage.getItem('isAdminMode')
    
    // If we have a stored preference, use it
    if (storedIsAdmin !== null) {
      const isAdminMode = storedIsAdmin === 'true'
      setIsAdmin(isAdminMode)
      
      // Set the displayed role based on the stored preference
      if (isAdminMode) {
        setDisplayedRole(userRole)
      } else {
        setDisplayedRole("Task Receiver")
      }
    } else {
      // Default to admin mode if user has admin role
      const defaultIsAdmin = userRole === "Admin" || userRole === "Super Admin"
      setIsAdmin(defaultIsAdmin)
      sessionStorage.setItem('isAdminMode', defaultIsAdmin.toString())
    }
  }, [userRole])

  const handleRoleSwitch = () => {
    const newIsAdmin = !isAdmin
    setIsAdmin(newIsAdmin)
    
    // Store the preference in sessionStorage
    sessionStorage.setItem('isAdminMode', newIsAdmin.toString())
    
    // Update the displayed role based on the switch
    if (newIsAdmin) {
      setDisplayedRole(userRole) // Original admin role
    } else {
      setDisplayedRole("Task Receiver") // Switch to Task Receiver
    }
  }

  // Only render the role switch button for Admin and Super Admin
  const isAdminOrSuperAdmin = userRole === "Admin" || userRole === "Super Admin"

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <div className="flex items-baseline gap-4 mb-4 h-12">
          <h1 className="text-5xl font-bold text-[#333333]">User Profile</h1>
          <div className="w-24">
            {isAdmin && isAdminOrSuperAdmin && <span className="text-4xl font-bold text-[#8B2332]">Admin</span>}
          </div>
        </div>

        <div className="p-3 m-5">
          <div className="flex items-center">
            <div className="pr-1">
              <img
                src={profilePhoto || "https://placehold.co/200"}
                className="rounded-full border border-white w-40 h-40 object-cover"
                alt="Profile"
              />
            </div>
            <div className="pl-5">
              <span className="text-4xl font-bold text-[#8B2332]">{userName}</span>
              <h1 className="text-5xl font-bold text-[#333333] h-16">{displayedRole}</h1>
              <h5 className="text-xl font-bold">{userEmail}</h5>
            </div>
          </div>

          <div className="p-6 flex flex-col sm:flex-row gap-4">
            {isAdminOrSuperAdmin && (
              <Button
                className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center"
                onClick={handleRoleSwitch}
              >
                {isAdmin ? "Switch to Task Receiver Menu" : "Switch to Admin Menu"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}