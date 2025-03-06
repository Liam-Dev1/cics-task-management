// page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UserList from "./user-list"
import AddEditUserForm from "./add-edit-user-form"
import { Sidebar } from "@/components/ui/sidebar"
import { User } from "@/app/users/types"
import { db, auth } from "@/app/firebase/firebase.config"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { createUserWithEmailAndPassword } from "firebase/auth"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // Fetch users from Firestore when the component mounts or when the authenticated user changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (user) {
        try {
          // Fetch all users from the "users" collection
          const querySnapshot = await getDocs(collection(db, "users"));
          const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
          setUsers(usersData); // Update the state with the fetched users
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    };

    fetchUsers();
  }, [user]); // Re-run this effect when the authenticated user changes

  // Redirect unauthenticated users to the login page
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // Redirect to the login page if the user is not authenticated
    }
  }, [user, loading]); // Re-run this effect when the authenticated user or loading state changes

  const handleAddUser = async (newUser: User) => {
    if (!user) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, "defaultPassword");
      const firebaseUser = userCredential.user;

      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...newUser,
        id: firebaseUser.uid,
      });

      setUsers([...users, { ...newUser, id: firebaseUser.uid }]); // Update local state
      setIsAddingUser(false);
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user.");
    }
  };

  const handleEditUser = async (updatedUser: User) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", updatedUser.id);
      const { id, ...userData } = updatedUser;
      await updateDoc(userRef, userData);
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u))); // Update local state
      setEditingUser(undefined);
    } catch (error) {
      console.error("Error editing user:", error);
      alert("Failed to edit user.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", id));
      setUsers(users.filter((u) => u.id !== id)); // Update local state
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>You must be logged in to access this page.</div>;
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
          onToggleActive={(id: string) => {
            // Implement the toggle active functionality here
          }}
          onChangeRole={(id: string, newRole: string) => {
            // Implement the change role functionality here
          }}
          currentUserRole={user?.role}
        />
        <AddEditUserForm
          user={editingUser}
          onSave={editingUser ? handleEditUser : handleAddUser}
          onCancel={() => {
            setIsAddingUser(false);
            setEditingUser(undefined);
          }}
          isOpen={isAddingUser || !!editingUser}
          currentUserRole={user?.role || ""}
        />
      </div>
    </div>
  );
}