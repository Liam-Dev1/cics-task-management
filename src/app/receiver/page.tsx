"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UserList from "./user-list"
import AddEditUserForm from "./add-edit-user-form"
import { Sidebar } from "@/components/sidebar-admin"
import type { User } from "../../lib/types"
import { db, auth } from "@/lib/firebase/firebase.config"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"

export default function AdminRecieverPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [user, loading] = useAuthState(auth)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const router = useRouter()

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      if (user) {
        try {
          const querySnapshot = await getDocs(collection(db, "users"))
          const usersData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
          setUsers(usersData)
        } catch (error) {
          console.error("Error fetching users:", error)
        }
      }
    }

    fetchUsers()
  }, [user])

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
    if (!user) return

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, "defaultPassword")
      const firebaseUser = userCredential.user

      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...newUser,
        id: firebaseUser.uid,
      })

      setUsers([...users, { ...newUser, id: firebaseUser.uid }])
      setIsAddingUser(false)
    } catch (error) {
      console.error("Error adding user:", error)
      alert("Failed to add user.")
    }
  }

  const handleEditUser = async (updatedUser: User) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", updatedUser.id)
      const { id, ...userData } = updatedUser
      await updateDoc(userRef, userData)
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
      setEditingUser(undefined)
    } catch (error) {
      console.error("Error editing user:", error)
      alert("Failed to edit user.")
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, "users", id))
      setUsers(users.filter((u) => u.id !== id))
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user.")
    }
  }

  const handleToggleActive = async (id: string) => {
    if (!user) return

    try {
      const userToUpdate = users.find((u) => u.id === id)
      if (userToUpdate) {
        const userRef = doc(db, "users", id)
        const newActiveStatus = !userToUpdate.isActive
        await updateDoc(userRef, { isActive: newActiveStatus })
        setUsers(users.map((u) => (u.id === id ? { ...u, isActive: newActiveStatus } : u)))
      }
    } catch (error) {
      console.error("Error toggling user active status:", error)
      alert("Failed to update user status.")
    }
  }

  const handleChangeRole = async (id: string, role: "user" | "admin" | "super admin") => {
    if (!user) return

    try {
      const userRef = doc(db, "users", id)
      await updateDoc(userRef, { role })
      setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)))
    } catch (error) {
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

  if (!user) {
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
            currentUserRole={user?.role || ""}
          />
          <AddEditUserForm
            user={editingUser}
            onSave={editingUser ? handleEditUser : handleAddUser}
            onCancel={() => {
              setIsAddingUser(false)
              setEditingUser(undefined)
            }}
            isOpen={isAddingUser || !!editingUser}
            currentUserRole={user?.role || ""}
          />
        </div>
      </div>
    </div>
  )
}

