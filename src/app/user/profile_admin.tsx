"use client"

import { Sidebar } from "@/components/ui/sidebar"
import { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { app } from "@/app/firebase/firebase.config" // Ensure this is correctly configured

interface Test {
  users: User[];
}

export default function Profile({ users }: Test) {
  const [isAdmin, setIsAdmin] = useState(true)
  const [profilePhoto, setProfilePhoto] = useState("https://placehold.co/200") // Default placeholder image
  const [isUploading, setIsUploading] = useState(false) // To handle loading state during upload

  const handleRoleSwitch = () => {
    setIsAdmin(!isAdmin)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const storage = getStorage(app)
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
      <div className="flex-1 bg-gray-100">
        <div className="p-8">
          <div className="flex items-baseline gap-4 mb-4">
            <h1 className="text-5xl font-bold text-[#333333]">User Profile</h1>
            {isAdmin && <span className="text-4xl font-bold text-[#8B2332]">Admin</span>}
          </div>

          <div className="p-3 m-5">
            <div className="flex items-center">
              <div className="pr-1">
                <img
                  src={profilePhoto}
                  className="rounded-full border border-white w-40 h-40 object-cover"
                  alt="Profile"
                />
              </div>
              <div className="pl-5">
                <span className="text-4xl font-bold text-[#8B2332] leading-[1.3]">John Doe</span>
                <h1 className="text-5xl font-bold text-[#333333] leading-[1]">Accountant</h1>
                <h5 className="text-xl font-bold leading-[1.1]">JohnDoe@gmail.com</h5>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
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
      </div>
    </div>
  )
}
