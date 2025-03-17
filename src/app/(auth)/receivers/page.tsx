"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import { TaskReceiver } from "@/components/task-receiver"
import { NewReceiverForm } from "@/components/new-receiver-form"
import { Pagination } from "@/components/pagination"

interface Receiver {
  id: string
  name: string
  role: string
  email: string
}

const ITEMS_PER_PAGE = 7

export default function TaskReceiversPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [receivers] = useState<Receiver[]>([
    { id: "1", name: "Jane Doe", role: "Writer", email: "jane@example.com" },
    { id: "2", name: "Juan De La Cruz", role: "Singer", email: "juan@example.com" },
    { id: "3", name: "Maria Clara", role: "Guitarist", email: "maria@example.com" },
    { id: "4", name: "John Smith", role: "Chemist", email: "john@example.com" },
    { id: "5", name: "Jaquavous Bartholomew", role: "Writer", email: "jaq@example.com" },
    { id: "6", name: "Alice Johnson", role: "Developer", email: "alice@example.com" },
    { id: "7", name: "Bob Wilson", role: "Designer", email: "bob@example.com" },
  ])
  const [searchQuery, setSearchQuery] = useState("")

  const totalPages = Math.ceil(receivers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentReceivers = receivers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchQuery)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 flex-grow overflow-auto">
          <h1 className="text-4xl font-bold mb-6">Task Receivers</h1>

          <div className="flex gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search Task Receivers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10"
                />
                <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <Button variant="default" onClick={() => setShowNewForm(true)} className="whitespace-nowrap">
              Create New Receiver
            </Button>
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-4 px-4 mb-2">
            <div className="font-semibold">Name</div>
            <div className="font-semibold">Role</div>
          </div>

          <div className="space-y-4">
            {showNewForm && <NewReceiverForm onCancel={() => setShowNewForm(false)} />}

            <div className="space-y-4">
              {currentReceivers.map((receiver) => (
                <TaskReceiver key={receiver.id} receiver={receiver} />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </main>
    </div>
  )
}

