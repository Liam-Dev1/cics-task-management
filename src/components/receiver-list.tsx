"use client"

import { useState } from "react"
import { User2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReceiverForm } from "./receiver-form"

interface Receiver {
  id: number
  name: string
  role: string
  email: string
}

const initialReceivers: Receiver[] = [
  { id: 1, name: "Jane Doe", role: "Writer", email: "jane@example.com" },
  { id: 2, name: "Juan De La Cruz", role: "Singer", email: "juan@example.com" },
  { id: 3, name: "Maria Clara", role: "Guitarist", email: "maria@example.com" },
  { id: 4, name: "John Smith", role: "Chemist", email: "john@example.com" },
  { id: 5, name: "Jaquavous Bartholomew", role: "Writer", email: "jaq@example.com" },
]

export function ReceiverList() {
  const [receivers, setReceivers] = useState(initialReceivers)
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <div className="space-y-2 p-4">
      {receivers.map((receiver) => (
        <div key={receiver.id}>
          {editingId === receiver.id ? (
            <ReceiverForm
              initialData={receiver}
              onCancel={() => setEditingId(null)}
              onSave={(data) => {
                setReceivers(receivers.map((r) => (r.id === receiver.id ? { ...r, ...data } : r)))
                setEditingId(null)
              }}
              isEdit
            />
          ) : (
            <div className="flex items-center gap-4 p-4 bg-red-900 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-zinc-400 flex items-center justify-center">
                  <User2 className="h-6 w-6 text-zinc-600" />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Input
                  value={receiver.name}
                  readOnly
                  className="bg-transparent border-none focus-visible:ring-0 p-0 h-auto"
                />
                <Input
                  value={receiver.role}
                  readOnly
                  className="bg-transparent border-none focus-visible:ring-0 p-0 h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="bg-zinc-600 hover:bg-zinc-500">
                  View Task History
                </Button>
                <Button variant="secondary" size="sm" className="bg-zinc-600 hover:bg-zinc-500">
                  View Reports
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-zinc-600 hover:bg-zinc-500"
                  onClick={() => setEditingId(receiver.id)}
                >
                  Edit
                </Button>
                <Button variant="secondary" size="sm" className="bg-zinc-600 hover:bg-zinc-500">
                  Deactivate
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

