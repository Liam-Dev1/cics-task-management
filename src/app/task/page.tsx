"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/firebase.config";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import TaskManagement from "./admintaskview";
import TasksPage from "./usertaskview";
import { Sidebar } from "@/components/sidebar-admin";

export default function TaskPage() {
  const [user, loading, error] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    const fetchUserRole = async () => {
      if (user?.email) {
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUserRole(userData.role);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      }
    };

    fetchUserRole();
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return <div>You must be logged in to access this page.</div>;
  }

  return (
    <div>
      {userRole === "admin" || userRole === "super admin" ? (
        <TaskManagement />
      ) : (
        <TasksPage />
      )}
    </div>
  );
}