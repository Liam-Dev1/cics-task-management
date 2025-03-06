// add-edit-user-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User } from "@/app/users/types"

interface AddEditUserFormProps {
  user?: User; // Ensure this is typed correctly
  onSave: (user: User) => void;
  onCancel: () => void;
  isOpen: boolean;
  currentUserRole: string;
}

export default function AddEditUserForm({ user, onSave, onCancel, isOpen, currentUserRole }: AddEditUserFormProps) {
  const [formData, setFormData] = useState<{
    name: string; // Full name field
    email: string;
    role: "user" | "admin" | "super admin";
  }>({
    name: "", // Full name field
    email: "",
    role: "user", // Default role is "user"
  });

  // Initialize form data when the user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name, // Set full name
        email: user.email,
        role: user.role,
      });
    } else {
      setFormData({
        name: "", // Reset full name
        email: "",
        role: "user",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newUser: User = {
      id: user?.id || Date.now().toString(), // Generate a new id if user is undefined
      name: formData.name.trim(), // Use the full name
      email: formData.email,
      role: formData.role,
      isActive: user?.isActive || true, // Default to true if user is undefined
    };
    onSave(newUser);
  };

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
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange("role", value)}
            >
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
  );
}