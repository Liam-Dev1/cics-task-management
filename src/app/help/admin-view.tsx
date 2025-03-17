"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Image from "next/image"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar-admin"

type TabType = "manual" | "faq" | "contact" | "manage"

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<TabType>("faq")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [openDialog, setOpenDialog] = useState<{ type: string; id?: string } | undefined>(undefined)

  // Sample data for manual sections
  const [manualSections, setManualSections] = useState([
    {
      id: "1",
      title: "Getting Started",
      items: ["Overview", "System Requirements", "Setting Up Your Account"],
    },
    {
      id: "2",
      title: "Using the System",
      items: ["Dashboard Basics", "Managing Your Tasks", "Notifications and Reminders"],
    },
    {
      id: "3",
      title: "Reports",
      items: ["Viewing Your Task History", "Generating Performance Reports"],
    },
    {
      id: "4",
      title: "Account Settings",
      items: ["Updating Profile Information", "Password Reset"],
    },
  ])

  // Sample data for FAQ entries
  const [faqEntries, setFaqEntries] = useState([
    {
      id: "1",
      question: "Lorem ipsum dolor sit amet?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur mauris vel nulla volutpat, ac ullamcorper sapien ultricies.",
    },
    {
      id: "2",
      question: "Sed ut perspiciatis unde omnis iste natus error?",
      answer:
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
    },
    {
      id: "3",
      question: "Qui officia deserunt mollit anim id est laborum?",
      answer:
        "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
    },
    {
      id: "4",
      question: "Nisi ut aliquid ex ea commodi consequatur?",
      answer:
        "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    },
  ])

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    question: "",
    answer: "",
  })

  // Handle deleting a FAQ entry
  const handleDeleteFaq = (id: string) => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      setFaqEntries((prev) => prev.filter((faq) => faq.id !== id))
    }
  }

  // Handle deleting a manual section
  const handleDeleteSection = (id: string) => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this section?")) {
      setManualSections((prev) => prev.filter((section) => section.id !== id))
    }
  }

  // Handle deleting a manual item
  const handleDeleteItem = (sectionId: string, itemIndex: number) => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this item?")) {
      setManualSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId) {
            const newItems = [...section.items]
            newItems.splice(itemIndex, 1)
            return { ...section, items: newItems }
          }
          return section
        }),
      )
    }
  }

  // Handle opening edit dialog
  const handleOpenDialog = (type: string, id?: string) => {
    setOpenDialog({ type, id })

    if (type === "editSection" && id) {
      const section = manualSections.find((s) => s.id === id)
      if (section) {
        setEditForm({
          ...editForm,
          title: section.title,
          content: "",
        })
      }
    } else if (type === "editItem" && id) {
      // Find the section and item
      for (const section of manualSections) {
        const itemIndex = section.items.findIndex((_, index) => `${section.id}-${index}` === id)
        if (itemIndex !== -1) {
          setEditForm({
            ...editForm,
            content: section.items[itemIndex],
          })
          break
        }
      }
    } else if (type === "editFaq" && id) {
      const faq = faqEntries.find((f) => f.id === id)
      if (faq) {
        setEditForm({
          ...editForm,
          question: faq.question,
          answer: faq.answer,
        })
      }
    } else if (type === "addSection") {
      setEditForm({
        ...editForm,
        title: "",
        content: "",
      })
    } else if (type === "addFaq") {
      setEditForm({
        ...editForm,
        question: "",
        answer: "",
      })
    }
  }

  // Handle closing dialog
  const handleCloseDialog = () => {
    setOpenDialog(undefined)
  }

  // Handle saving edits
  const handleSave = () => {
    if (!openDialog) return

    if (openDialog.type === "editSection" && openDialog.id) {
      setManualSections((prev) =>
        prev.map((section) => (section.id === openDialog.id ? { ...section, title: editForm.title } : section)),
      )
    } else if (openDialog.type === "editItem" && openDialog.id) {
      // Parse the ID to get section ID and item index
      const [sectionId, itemIndexStr] = openDialog.id.split("-")
      const itemIndex = Number.parseInt(itemIndexStr)

      setManualSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId) {
            const newItems = [...section.items]
            newItems[itemIndex] = editForm.content
            return { ...section, items: newItems }
          }
          return section
        }),
      )
    } else if (openDialog.type === "editFaq" && openDialog.id) {
      setFaqEntries((prev) =>
        prev.map((faq) =>
          faq.id === openDialog.id ? { ...faq, question: editForm.question, answer: editForm.answer } : faq,
        ),
      )
    } else if (openDialog.type === "addSection") {
      const newId = (Math.max(...manualSections.map((s) => Number.parseInt(s.id))) + 1).toString()
      setManualSections((prev) => [...prev, { id: newId, title: editForm.title, items: [] }])
    } else if (openDialog.type === "addFaq") {
      const newId = (Math.max(...faqEntries.map((f) => Number.parseInt(f.id))) + 1).toString()
      setFaqEntries((prev) => [...prev, { id: newId, question: editForm.question, answer: editForm.answer }])
    }

    handleCloseDialog()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold text-gray-800 flex items-center">
            Help and Support
            <span className="ml-4 text-[#8B0000] text-3xl font-bold">Admin</span>
          </h1>
        </div>

        {/* Search and Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className="relative w-full sm:w-auto sm:min-w-[300px] mb-4">
            <Input type="search" placeholder="Search" className="pr-10 bg-gray-100 border-gray-300 rounded" />
            <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant={activeTab === "faq" ? "default" : "outline"}
              className={
                activeTab === "faq"
                  ? "bg-[#8B0000] hover:bg-[#6B0000] text-white"
                  : "bg-[#333333] text-white hover:bg-[#444444]"
              }
              onClick={() => setActiveTab("faq")}
            >
              FAQ
            </Button>

            <Button
              variant={activeTab === "manual" ? "default" : "outline"}
              className={
                activeTab === "manual"
                  ? "bg-[#8B0000] hover:bg-[#6B0000] text-white"
                  : "bg-[#333333] text-white hover:bg-[#444444]"
              }
              onClick={() => setActiveTab("manual")}
            >
              Manual
            </Button>

            <Button
              variant={activeTab === "contact" ? "default" : "outline"}
              className={
                activeTab === "contact"
                  ? "bg-[#8B0000] hover:bg-[#6B0000] text-white"
                  : "bg-[#333333] text-white hover:bg-[#444444]"
              }
              onClick={() => setActiveTab("contact")}
            >
              Contact Support
            </Button>

            <Button
              variant="default"
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white ml-auto"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Exit Edit Mode" : "Edit Mode"}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === "manual" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Manual</h2>
              {editMode && (
                <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => handleOpenDialog("addSection")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Section
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {manualSections.map((section) => (
                <section key={section.id}>
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    {editMode && (
                      <div className="ml-2 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleOpenDialog("editSection", section.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <ul className="list-disc pl-8 space-y-1">
                    {section.items.map((item, index) => (
                      <li key={`${section.id}-${index}`} className="flex items-center">
                        <span>{item}</span>
                        {editMode && (
                          <div className="ml-2 flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 h-6 w-6 p-0"
                              onClick={() => handleOpenDialog("editItem", `${section.id}-${index}`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                              onClick={() => handleDeleteItem(section.id, index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                    {editMode && (
                      <li>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
                          <Plus className="h-3 w-3 mr-1" /> Add Item
                        </Button>
                      </li>
                    )}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">FAQ</h2>
              {editMode && (
                <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => handleOpenDialog("addFaq")}>
                  <Plus className="h-4 w-4 mr-2" /> Add FAQ
                </Button>
              )}
            </div>

  

            <div className="space-y-6">
              {faqEntries.map((faq) => (
                <div key={faq.id}>
                  <div className="flex items-center">
                    <h3 className="text-xl font-bold">Q: {faq.question}</h3>
                    {editMode && (
                      <div className="ml-2 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleOpenDialog("editFaq", faq.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteFaq(faq.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Support Tickets</h2>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">#1234</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">john.doe@example.com</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">Cannot access dashboard</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">2023-05-12</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        View
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">#1233</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">jane.smith@example.com</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">Task not saving</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Resolved
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">2023-05-10</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        View
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Dialogs */}
        <Dialog open={!!openDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {openDialog?.type === "editSection" && "Edit Section"}
                {openDialog?.type === "editItem" && "Edit Item"}
                {openDialog?.type === "editFaq" && "Edit FAQ"}
                {openDialog?.type === "addSection" && "Add New Section"}
                {openDialog?.type === "addFaq" && "Add New FAQ"}
              </DialogTitle>
            </DialogHeader>

            {(openDialog?.type === "editSection" || openDialog?.type === "addSection") && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Section Title
                  </label>
                  <Input
                    id="title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
              </div>
            )}

            {openDialog?.type === "editItem" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Item Content
                  </label>
                  <Input
                    id="content"
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  />
                </div>
              </div>
            )}

            {(openDialog?.type === "editFaq" || openDialog?.type === "addFaq") && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="question" className="text-sm font-medium">
                    Question
                  </label>
                  <Input
                    id="question"
                    value={editForm.question}
                    onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="answer" className="text-sm font-medium">
                    Answer
                  </label>
                  <Textarea
                    id="answer"
                    rows={4}
                    value={editForm.answer}
                    onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

