"use client"

import { useState } from "react"
import { Search, Download, Plus, Edit, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function ReceiverList({ receivers, onEdit, onDelete, onToggleActive, onAddNew }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredReceivers = receivers.filter(
    (receiver) =>
      receiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receiver.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Role,Email,Status\n" +
      receivers.map((r) => `${r.name},${r.role},${r.email},${r.isActive ? "Active" : "Inactive"}`).join("\n")
    const encodedUri = encodeURI(csvContent)
    window.open(encodedUri)
  }

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
          <Button className="bg-[#812c2d] hover:bg-[#9f393b] text-white flex items-center" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button className="bg-[#812c2d] hover:bg-[#9f393b] text-white flex items-center" onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Receiver</span>
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
            {filteredReceivers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center text-gray-500">
                  No receivers found
                </td>
              </tr>
            ) : (
              filteredReceivers.map((receiver) => (
                <tr key={receiver.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        {receiver.name.charAt(0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">{receiver.name}</td>
                  <td className="px-4 py-2">{receiver.role}</td>
                  <td className="px-4 py-2 text-center">
                    <Badge
                      variant="outline"
                      className={`${
                        receiver.isActive
                          ? "bg-green-100 text-green-800 border-green-400"
                          : "bg-red-100 text-red-800 border-red-400"
                      }`}
                    >
                      {receiver.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1 h-8"
                        onClick={() => onEdit(receiver)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs px-2 py-1 h-8 ${
                          receiver.isActive
                            ? "text-yellow-600 hover:text-yellow-700"
                            : "text-green-600 hover:text-green-700"
                        }`}
                        onClick={() => onToggleActive(receiver.id)}
                      >
                        {receiver.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1 h-8 text-red-600 hover:text-red-700"
                        onClick={() => onDelete(receiver.id)}
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

