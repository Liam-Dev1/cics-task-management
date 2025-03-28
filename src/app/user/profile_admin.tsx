"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar-admin"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/app/firebase/firebase.config" // Ensure this is correctly configured

interface ProfileProps {
  users: any[]
  userName: string | null
  userEmail: string | null
  userRole: string | null
  profilePhoto: string | null
}

export default function Profile({ users, userName, userEmail, userRole, profilePhoto }: ProfileProps) {
  const [isAdmin, setIsAdmin] = useState(userRole === "Admin" || userRole === "Super Admin")
  const [isUploading, setIsUploading] = useState(false)
  const [profilePhotoState, setProfilePhoto] = useState(profilePhoto)

  const handleRoleSwitch = () => {
    setIsAdmin(!isAdmin)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const storageRef = ref(storage, `profile-photos/${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      setProfilePhoto(downloadURL)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload profile photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <div className="flex items-baseline gap-4 mb-4">
          <h1 className="text-5xl font-bold text-[#333333]">User Profile</h1>
          {isAdmin && <span className="text-4xl font-bold text-[#8B2332]">Admin</span>}
        </div>

        <div className="p-3 m-5">
          <div className="flex items-center">
            <div className="pr-1">
              <img
                src={profilePhotoState || "https://placehold.co/200"}
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
            {/* Hidden file input */}
            <input
              type="file"
              id="profile-photo-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* Label acts as a button */}
            <label htmlFor="profile-photo-upload" className="cursor-pointer">
              <Button
                className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Edit Profile Picture"}
              </Button>
            </label>

            <Button
              className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center"
              onClick={handleRoleSwitch}
            >
              {isAdmin ? "Switch to Task Receiver Menu" : "Switch to Admin Menu"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

