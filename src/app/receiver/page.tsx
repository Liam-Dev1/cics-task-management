"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UserList from "./user-list"
import AddEditUserForm from "./add-edit-user-form"
import { Sidebar } from "@/components/sidebar-admin"
import { db, auth } from "@/lib/firebase/firebase.config"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { onAuthStateChanged } from "firebase/auth"
import { FirebaseError } from "firebase/app" // Import FirebaseError from the correct module

// Define the User type directly here to resolve the import error
interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin" | "super admin"
  isActive: boolean
  jobTitle?: string
}

export default function AdminRecieverPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [currentUser, loading] = useAuthState(auth) // Renamed from 'user' to 'currentUser' to avoid confusion
  const [currentUserRole, setCurrentUserRole] = useState<string>("") // Store the current user's role separately
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const router = useRouter()

  // Fetch users from Firestore and determine current user's role
  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser) {
        try {
          const querySnapshot = await getDocs(collection(db, "users"))
          const usersData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
          setUsers(usersData)

          // Find the current user's role
          const currentUserData = usersData.find((u) => u.id === currentUser.uid)
          if (currentUserData) {
            setCurrentUserRole(currentUserData.role)
          }
        } catch (error) {
          console.error("Error fetching users:", error)
        }
      }
    }

    fetchUsers()
  }, [currentUser])

  // Check if sidebar should be minimized based on orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== "undefined") {
        const isPortrait = window.matchMedia("(orientation: portrait)").matches
        setIsSidebarMinimized(isPortrait)
      }
    }

    // Initial check
    checkOrientation()

    // Set up listener for orientation changes
    const mediaQuery = window.matchMedia("(orientation: portrait)")
    const handleOrientationChange = () => checkOrientation()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleOrientationChange)
    } else {
      window.addEventListener("resize", handleOrientationChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleOrientationChange)
      } else {
        window.removeEventListener("resize", handleOrientationChange)
      }
    }
  }, [])

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleAddUser = async (newUser: User) => {
    if (!currentUser) return

    try {
      // Instead of creating a Firebase Auth user, just create a Firestore document
      // Generate a unique ID for the user
      const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`

      // Create the user document in Firestore
      await setDoc(doc(db, "users", userId), {
        ...newUser,
        id: userId,
        isActive: true, // Ensure isActive is set
      })

      // Update the local state
      setUsers([...users, { ...newUser, id: userId, isActive: true }])
      setIsAddingUser(false)
    } catch (error: unknown) {
      console.error("Error adding user:", error)
      let errorMessage = "Failed to add user."

      if (error instanceof FirebaseError) {
        // Provide more specific error messages based on Firebase error codes
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already in use."
            break
          case "auth/invalid-email":
            errorMessage = "The email address is not valid."
            break
          case "auth/weak-password":
            errorMessage = "The password is too weak."
            break
          default:
            errorMessage = `Error: ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`
      }

      alert(errorMessage)
    }
  }

  const handleEditUser = async (updatedUser: User) => {
    if (!currentUser) return

    try {
      const userRef = doc(db, "users", updatedUser.id)
      const { id, ...userData } = updatedUser
      await updateDoc(userRef, userData)
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
      setEditingUser(undefined)
    } catch (error: unknown) {
      console.error("Error editing user:", error)
      alert("Failed to edit user.")
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!currentUser) return

    try {
      await deleteDoc(doc(db, "users", id))
      setUsers(users.filter((u) => u.id !== id))
    } catch (error: unknown) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user.")
    }
  }

  const handleToggleActive = async (id: string) => {
    if (!currentUser) return

    try {
      const userToUpdate = users.find((u) => u.id === id)
      if (userToUpdate) {
        const userRef = doc(db, "users", id)
        const newActiveStatus = !userToUpdate.isActive
        await updateDoc(userRef, { isActive: newActiveStatus })
        setUsers(users.map((u) => (u.id === id ? { ...u, isActive: newActiveStatus } : u)))
      }
    } catch (error: unknown) {
      console.error("Error toggling user active status:", error)
      alert("Failed to update user status.")
    }
  }

  const handleChangeRole = async (id: string, role: "user" | "admin" | "super admin") => {
    if (!currentUser) return

    try {
      const userRef = doc(db, "users", id)
      await updateDoc(userRef, { role })
      setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)))
    } catch (error: unknown) {
      console.error("Error changing user role:", error)
      alert("Failed to update user role.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B2332] mb-4"></div>
        <div className="text-xl ml-3">Loading users...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">You must be logged in to access this page.</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar with onMinimize prop */}
      <Sidebar onMinimize={setIsSidebarMinimized} />

      {/* Main content area with dynamic margin based on sidebar state */}
      <div
        className="flex-1 transition-all duration-300"
        style={{
          marginLeft: isSidebarMinimized ? "4rem" : "16rem",
          width: `calc(100% - ${isSidebarMinimized ? "4rem" : "16rem"})`,
        }}
      >
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">User Management</h1>
          <UserList
            users={users}
            onEdit={setEditingUser}
            onDelete={handleDeleteUser}
            onAddNew={() => setIsAddingUser(true)}
            onToggleActive={handleToggleActive}
            onChangeRole={handleChangeRole}
            currentUserRole={currentUserRole}
          />
          <AddEditUserForm
            user={editingUser}
            onSave={editingUser ? handleEditUser : handleAddUser}
            onCancel={() => {
              setIsAddingUser(false)
              setEditingUser(undefined)
            }}
            isOpen={isAddingUser || !!editingUser}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>
    </div>
  )
}

