"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AddEditReceiverForm({ receiver, onSave, onCancel, isOpen }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    department: "",
  })

  useEffect(() => {
    if (receiver) {
      const [firstName, ...lastNameParts] = receiver.name.split(" ")
      setFormData({
        ...receiver,
        firstName,
        lastName: lastNameParts.join(" "),
      })
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        department: "",
      })
    }
  }, [receiver])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fullName = `${formData.firstName} ${formData.lastName}`.trim()
    onSave({ ...formData, name: fullName })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{receiver ? "Edit Receiver" : "Add New Receiver"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="writer">Writer</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="qa_tester">QA Tester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">Information Technology</SelectItem>
                <SelectItem value="cs">Computer Science</SelectItem>
                <SelectItem value="is">Information Systems</SelectItem>
                <SelectItem value="admin">Administration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#812c2d] hover:bg-[#9f393b] text-white">
              {receiver ? "Update Receiver" : "Add Receiver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

