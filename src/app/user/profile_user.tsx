"use client"

import type React from "react"
import { useState } from "react"

interface ProfileProps {
  users: any[]
  userName: string | null
  userEmail: string | null
  userRole: string | null
  profilePhoto: string | null
}

export default function ProfileUser({
  users,
  userName,
  userEmail,
  userRole,
  profilePhoto: initialProfilePhoto,
}: ProfileProps) {
  const [profilePhoto] = useState(initialProfilePhoto)
  
  // Capitalize the user role for display
  const displayRole = userRole ? 
    userRole.charAt(0).toUpperCase() + userRole.slice(1) : 
    "User"

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      <div className="flex items-baseline gap-4 mb-4">
        <h1 className="text-5xl font-bold text-[#333333]">User Profile</h1>
      </div>

      <div className="p-3 m-5">
        <div className="flex items-start">
          <div className="pr-6">
            <img
              src={profilePhoto || "/placeholder.svg?height=200&width=200"}
              className="rounded-full border border-white w-40 h-40 object-cover"
              alt="Profile"
            />
          </div>
          <div className="pl-2">
            <h2 className="text-4xl font-bold text-[#8B2332]">{userName || "User Name"}</h2>
            <h3 className="text-5xl font-bold text-[#333333]">{displayRole}</h3>
            <p className="text-xl">{userEmail || "email@example.com"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
