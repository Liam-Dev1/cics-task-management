"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "@/app/firebase/firebase.config"
import { onAuthStateChanged, onIdTokenChanged, User } from "firebase/auth"
import { useRouter } from "next/navigation"

const AuthContext = createContext<{user: User | null, loading: boolean}>({
  user: null,
  loading: true
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Handle auth state changes
    const unsubscribeAuthState = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      if (!user) router.push("/login")
    })

    // Handle token refresh
    const unsubscribeIdToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // Get fresh token and update session
        const token = await user.getIdToken(true)
        // You could store this token in a secure cookie or use it for API calls
      }
    })

    return () => {
      unsubscribeAuthState()
      unsubscribeIdToken()
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)