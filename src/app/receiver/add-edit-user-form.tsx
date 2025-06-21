// add-edit-user-form.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin" | "super admin"
  isActive: boolean
  jobTitle: string // Changed from optional to required
}

interface AddEditUserFormProps {
  user?: User
  onSave: (user: User) => void
  onCancel: () => void
  isOpen: boolean
  currentUserRole: string
}

export default function AddEditUserForm({ user, onSave, onCancel, isOpen, currentUserRole }: AddEditUserFormProps) {
  const [formData, setFormData] = useState<{
    name: string
    email: string
    role: "user" | "admin" | "super admin"
    jobTitle: string
  }>({
    name: "",
    email: "",
    role: "user",
    jobTitle: "",
  })

  const [errors, setErrors] = useState<{
    jobTitle?: string
    email?: string
  }>({})

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "user",
        jobTitle: "",
      })
    }
    setErrors({}) // Reset errors when form is opened or user changes
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = "Job Title is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const newUser: User = {
      id: user?.id || Date.now().toString(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      jobTitle: formData.jobTitle.trim(),
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

          {/* Job Title Field - Now Required */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="Enter job title"
              required
            />
            {errors.jobTitle && (
              <p className="text-sm text-red-500">{errors.jobTitle}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
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