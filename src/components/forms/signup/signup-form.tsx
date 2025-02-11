"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Input, Button } from "@/components/ui" 
import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { firebaseConfig } from "@/firebase/firebase" 

    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
  
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      setError("")
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        console.log("User signed up:", userCredential.user)
        // Here you would typically redirect the user or update the UI
      } catch (error) {
        setError("Failed to create an account. " + error.message)
      }
    }
  
    const handleGoogleSignUp = async () => {
      const provider = new GoogleAuthProvider()
      try {
        const result = await signInWithPopup(auth, provider)
        console.log("User signed up with Google:", result.user)
        // Here you would typically redirect the user or update the UI
      } catch (error) {
        setError("Failed to sign up with Google. " + error.message)
      }
    }
  
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center">
        {/* Background Image */}
        <img
          src="/images/login-background.jpg"
          alt="Sign Up Background"
          className="absolute inset-0 object-cover w-full h-full z-0"
        />
  
        {/* Content */}
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="flex flex-col items-center gap-6 text-white">
            {/* Logo */}
            <img src="/images/logo.svg" alt="Logo" className="w-24 h-24" />
  
            {/* Title */}
            <h1 className="text-3xl font-bold">Create an Account</h1>
  
            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4 mt-4">
              <Input
                type="text"
                placeholder="Full Name"
                className="h-12 bg-white text-black"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Full Name"
                required
              />
              <Input
                type="email"
                placeholder="Email"
                className="h-12 bg-white text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                className="h-12 bg-white text-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
                required
              />
              <Input
                type="password"
                placeholder="Confirm Password"
                className="h-12 bg-white text-black"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label="Confirm Password"
                required
              />
              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium bg-[#8B3A3A] hover:bg-[#722F2F] text-white"
              >
                Sign Up
              </Button>
              {error && <p className="text-red-500 text-center">{error}</p>}
  
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
  
              {/* Google Sign Up Button */}
              <Button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full h-12 text-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                Sign Up with Google
              </Button>
  
              <div className="text-center">
                <Link href="/login" className="text-white hover:underline">
                  Already have an account? Log in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }