// add-edit-user-form.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define the User interface here to match the one in the page component
interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin" | "super admin"
  isActive: boolean
  jobTitle?: string
}

interface AddEditUserFormProps {
  user?: User
  onSave: (user: User) => void
  onCancel: () => void
  isOpen: boolean
  currentUserRole: string
}

export default function AddEditUserForm({ user, onSave, onCancel, isOpen, currentUserRole }: AddEditUserFormProps) {
  // Update the formData state to include jobTitle
  const [formData, setFormData] = useState<{
    name: string
    email: string
    role: "user" | "admin" | "super admin"
    jobTitle: string // Add job title field
  }>({
    name: "",
    email: "",
    role: "user",
    jobTitle: "", // Initialize job title
  })

  // Update the useEffect to include jobTitle when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle || "", // Set job title from user data
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "user",
        jobTitle: "", // Reset job title
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Update the handleSubmit function to include jobTitle in the new user object
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newUser: User = {
      id: user?.id || Date.now().toString(),
      name: formData.name.trim(),
      email: formData.email,
      role: formData.role,
      jobTitle: formData.jobTitle.trim(), // Include job title
      isActive: user?.isActive || true,
    }
    onSave(newUser)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Job Title Field */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="Enter job title"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#812c2d] hover:bg-[#9f393b] text-white">
              {user ? "Update User" : "Add User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

