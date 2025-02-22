"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Receiver {
  id: string
  name: string
  role: string
  email: string
}

interface TaskReceiverProps {
  receiver: Receiver
}

export function TaskReceiver({ receiver }: TaskReceiverProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(receiver)

  const handleSave = () => {
    // Implement save functionality
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center p-4 rounded-lg",
        isEditing ? "bg-red-800" : "bg-red-900",
      )}
    >
      <div className="w-10 h-10 bg-gray-300 rounded-full" />

      <div>
        {isEditing ? (
          <Input
            value={editedData.name}
            onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
            className="bg-white/10 border-0 text-white"
          />
        ) : (
          <span className="text-white">{receiver.name}</span>
        )}
      </div>

      <div>
        {isEditing ? (
          <Input
            value={editedData.role}
            onChange={(e) => setEditedData({ ...editedData, role: e.target.value })}
            className="bg-white/10 border-0 text-white"
          />
        ) : (
          <span className="text-white">{receiver.role}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isEditing && (
          <>
            <Button variant="secondary" size="sm" className="bg-zinc-600 text-white hover:bg-zinc-700">
              View Task History
            </Button>
            <Button variant="secondary" size="sm" className="bg-zinc-600 text-white hover:bg-zinc-700">
              View Reports
            </Button>
          </>
        )}

        {isEditing ? (
          <>
            <Input
              value={editedData.email}
              onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
              placeholder="Email"
              className="bg-white/10 border-0 text-white w-40"
            />
            <Button
              variant="secondary"
              size="sm"
              className="bg-zinc-600 text-white hover:bg-zinc-700"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-zinc-600 text-white hover:bg-zinc-700"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="bg-zinc-600 text-white hover:bg-zinc-700"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button variant="secondary" size="sm" className="bg-zinc-600 text-white hover:bg-zinc-700">
              Deactivate
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

