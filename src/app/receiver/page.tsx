"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UserList from "./user-list"
import AddEditUserForm from "./add-edit-user-form"
import { Sidebar } from "@/components/sidebar-admin"
import type { User } from "../../lib/types"
import { db, auth } from "@/app/firebase/firebase.config"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"

export default function AdminRecieverPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

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

  useEffect(() => {
    // Set up the onAuthStateChanged observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      }
    })

    // Clean up the observer when the component unmounts
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
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>You must be logged in to access this page.</div>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 bg-white">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
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
  )
}