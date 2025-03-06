// user-list.tsx
"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "@/app/users/types"

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onChangeRole: (id: string, role: "user" | "admin" | "super admin") => void;
  onAddNew: () => void;
  currentUserRole: string;
}

export default function UserList({ users, onEdit, onDelete, onToggleActive, onChangeRole, onAddNew, currentUserRole }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.role?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );
  

  return (
    <div className="bg-white rounded border border-gray-200">
      <div className="p-4 flex justify-between items-center">
        <div className="relative flex-1 max-w-md mr-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by name or role..."
            className="pl-10 border-gray-300 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button className="bg-[#812c2d] hover:bg-[#9f393b] text-white flex items-center" onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-2">Profile</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user: User) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                      {user.name ? user.name.charAt(0) : "?"}
                    </div>
                   </div>
                  </td>
                  <td className="px-4 py-2 font-medium">{user.name}</td>
                  <td className="px-4 py-2">
                    <Select
                      value={user.role}
                      onValueChange={(value) => onChangeRole(user.id, value as "user" | "admin" | "super admin")}
                      disabled={currentUserRole !== "super admin"} // Only super admin can change roles
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
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Badge
                      variant="outline"
                      className={`${
                        user.isActive
                          ? "bg-green-100 text-green-800 border-green-400"
                          : "bg-red-100 text-red-800 border-red-400"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1 h-8"
                        onClick={() => onEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs px-2 py-1 h-8 ${
                          user.isActive
                            ? "text-yellow-600 hover:text-yellow-700"
                            : "text-green-600 hover:text-green-700"
                        }`}
                        onClick={() => onToggleActive(user.id)}
                      >
                        {user.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1 h-8 text-red-600 hover:text-red-700"
                        onClick={() => onDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}