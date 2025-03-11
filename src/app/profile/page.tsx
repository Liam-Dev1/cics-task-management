"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"

export default function UserProfileContent() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string>("/placeholder.svg?height=220&width=220")
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  // Handle profile picture upload
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle task receiver menu navigation
  const handleSwitchToTaskReceiver = () => {
    router.push("/users")
  }

  // Handle logout
  const handleLogout = () => {
    setIsLogoutDialogOpen(true)
  }

  const confirmLogout = () => {
    // Here you would typically clear auth tokens/cookies
    console.log("Logging out...")
    setIsLogoutDialogOpen(false)
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar>
        <SidebarContent />
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Profile Section */}
          <div className="flex flex-col items-center md:items-start md:flex-row md:gap-8 lg:gap-12">
            {/* Profile Image */}
            <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] bg-muted rounded-full flex-shrink-0 mb-6 md:mb-0 overflow-hidden">
              <Image
                src={profileImage || "/placeholder.svg"}
                alt="Profile picture"
                width={220}
                height={220}
                className="w-full h-full object-cover"
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* User Info */}
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#812c2d] mb-2">
                Christopher "Topeng" Ladao
              </h2>
              <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-2">
                Project Leader
              </h3>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground">
                christophertopengladao@gmail.com
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 md:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <Button
              className="h-12 md:h-14 text-white bg-[#812c2d] hover:bg-[#9f393b] rounded-md"
              onClick={handleProfilePictureClick}
            >
              Edit Profile Picture
            </Button>
            <Button
              className="h-12 md:h-14 text-white bg-[#812c2d] hover:bg-[#9f393b] rounded-md"
              onClick={handleSwitchToTaskReceiver}
            >
              Switch to Task Receiver Menu
            </Button>
            <Button 
              className="h-12 md:h-14 text-white bg-[#812c2d] hover:bg-[#9f393b] rounded-md" 
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Out?</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to log out?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#812c2d] hover:bg-[#9f393b] text-white" onClick={confirmLogout}>
              Yes, Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}