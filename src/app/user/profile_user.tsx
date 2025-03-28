"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar-user"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/app/firebase/firebase.config"

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
  const [isUploading, setIsUploading] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(initialProfilePhoto)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const storageRef = ref(storage, `profile-photos/${file.name}`)
      await uploadBytes(storageRef, file)

      const downloadURL = await getDownloadURL(storageRef)
      setProfilePhoto(downloadURL) // Update profile photo URL

      alert("Profile photo updated successfully!")
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
              <h3 className="text-5xl font-bold text-[#333333]">{userRole || "User"}</h3>
              <p className="text-xl">{userEmail || "email@example.com"}</p>
            </div>
          </div>

          <div className="mt-6">
            {/* File Input */}
            <input
              type="file"
              id="profile-photo-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <label htmlFor="profile-photo-upload" className="cursor-pointer">
              <Button className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Edit Profile Picture"}
              </Button>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

