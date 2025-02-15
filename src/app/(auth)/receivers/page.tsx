"use client"

import type React from "react"

import { useState } from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AppSidebar } from "@/components/app-sidebar"
import { ReceiverForm } from "@/components/receiver-form"
import { ReceiverList } from "@/components/receiver-list"

export default function TaskReceiversPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchQuery)
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">Task Receivers</h1>

        <div className="flex gap-4 mb-8">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Input
              type="text"
              placeholder="Search Task Receivers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>

          <Button onClick={() => setShowNewForm(true)} className="bg-zinc-800 text-white hover:bg-zinc-700">
            <Plus className="mr-2 h-4 w-4" />
            Create New Receiver
          </Button>
        </div>

        {showNewForm && <ReceiverForm onCancel={() => setShowNewForm(false)} />}

        <div className="grid grid-cols-[1fr_1fr] gap-4 px-4 mb-2">
          <div className="font-semibold">Name</div>
          <div className="font-semibold">Role</div>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)] rounded-md">
          <ReceiverList />
        </ScrollArea>
      </main>
    </div>
  )
}

