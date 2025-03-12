"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth, googleProvider, db } from "@/app/firebase/firebase.config"
import { signInWithPopup } from "firebase/auth"
import { collection, getDocs, query, where } from "firebase/firestore"
import type { User } from "@/app/users/types"

export default function LoginPage() {
  const [error, setError] = useState("")
  const router = useRouter()

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      if (user?.email) {
        // Query the "users" collection to check if the email exists
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", user.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as User

          // Check if the user is inactive
          if (userData.status === "inactive" || userData.isActive === false) {
            setError("Your account has been deactivated. Please contact an administrator.")
            await auth.signOut() // Log out the user if they are inactive
            return
          }

          // Check if the user is a super admin or admin
          if (userData.role === "super admin" || userData.role === "admin") {
            router.push("/users") // Redirect to the user management page
          } else {
            setError("You do not have permission to access this system.")
            await auth.signOut() // Log out the user if they are not authorized
          }
        } else {
          setError("Your email is not authorized to access this system.")
          await auth.signOut() // Log out the user if their email is not found
        }
      } else {
        setError("No email found in Google account.")
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred.")
      }
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/frassatibg.jpeg" alt="Building exterior" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex flex-col items-center gap-6 text-white">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 w-full">
            <div className="w-16 h-16 relative">
              <Image src="/placeholder.svg" alt="CICS Logo" width={64} height={64} className="object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">CICS</h1>
              <p className="text-lg text-white/90">
                Personnel Task Monitoring
                <br />
                And Management System
              </p>
            </div>
          </div>

          {/* Login with Google Button */}
          <div className="w-full space-y-4 mt-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 text-lg font-medium bg-white text-black border border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              <Image
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google Logo"
                width={20}
                height={20}
                className="object-contain"
              />
              Log in with Google
            </Button>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}