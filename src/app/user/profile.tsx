"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ProfileProps {
  users: any[]
  userName: string | null
  userEmail: string | null
  userRole: string | null
  profilePhoto: string | null
}

export default function Profile({
  users,
  userName,
  userEmail,
  userRole,
  profilePhoto: initialProfilePhoto,
}: ProfileProps) {
  const [isAdmin, setIsAdmin] = useState(userRole === "Admin" || userRole === "Super Admin")
  const [profilePhoto] = useState(initialProfilePhoto)

  const handleRoleSwitch = () => {
    setIsAdmin(!isAdmin)
  }

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      <div className="flex items-baseline gap-4 mb-4">
        <h1 className="text-5xl font-bold text-[#333333]">User Profile</h1>
        {isAdmin && <span className="text-4xl font-bold text-[#8B2332]">Admin</span>}
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
            <h1 className="text-5xl font-bold text-[#333333]">{userRole}</h1>
            <h5 className="text-xl font-bold">{userEmail}</h5>
          </div>
        </div>

        <div className="p-6 flex flex-col sm:flex-row gap-4">
          <Button className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white" onClick={handleRoleSwitch}>
            {isAdmin ? "Switch to Task Receiver Menu" : "Switch to Admin Menu"}
          </Button>
        </div>
      </div>
    </div>
  )
}

