"use client"

import { useState, useEffect } from "react"
import ReceiverList from "./receiver-list"
import AddEditReceiverForm from "./add-edit-receiver-form"
import { Sidebar } from "@/components/ui/sidebar"
import { Receiver } from "@/app/receivers/types"

export default function ReceiversPage() {
  const [receivers, setReceivers] = useState<Receiver[]>([])
  const [editingReceiver, setEditingReceiver] = useState<Receiver | undefined>(undefined)
  const [isAddingReceiver, setIsAddingReceiver] = useState(false)

  useEffect(() => {
    const storedReceivers = localStorage.getItem("receivers")
    if (storedReceivers) {
      setReceivers(JSON.parse(storedReceivers))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("receivers", JSON.stringify(receivers))
  }, [receivers])

  const handleAddReceiver = (newReceiver: Receiver) => {
    setReceivers([...receivers, { ...newReceiver, id: Date.now().toString(), isActive: true }])
    setIsAddingReceiver(false)
  }

  const handleEditReceiver = (updatedReceiver: Receiver) => {
    setReceivers(receivers.map((r) => (r.id === updatedReceiver.id ? updatedReceiver : r)))
    setEditingReceiver(undefined)
  }

  const handleDeleteReceiver = (id: string) => {
    setReceivers(receivers.filter((r) => r.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setReceivers(receivers.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 bg-white">
        <h1 className="text-2xl font-bold mb-4">Task Receivers</h1>
        <ReceiverList
          receivers={receivers}
          onEdit={setEditingReceiver}
          onDelete={handleDeleteReceiver}
          onToggleActive={handleToggleActive}
          onAddNew={() => setIsAddingReceiver(true)}
        />
        <AddEditReceiverForm
          receiver={editingReceiver}
          onSave={editingReceiver ? handleEditReceiver : handleAddReceiver}
          onCancel={() => {
            setIsAddingReceiver(false)
            setEditingReceiver(undefined)
          }}
          isOpen={isAddingReceiver || !!editingReceiver}
        />
      </div>
    </div>
  )
}
