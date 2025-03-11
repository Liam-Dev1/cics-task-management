"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, Edit2, Save } from "lucide-react"

interface FAQ {
  id: number
  question: string
  answer: string
}

export default function HelpAndSupport() {
  const [activeSection, setActiveSection] = useState<"faq" | "manual" | "contact">("faq")
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: 1,
      question: "Lorem ipsum dolor sit amet?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur mauris vel nulla volutpat, ac ullamcorper sapien ultricies.",
    },
    {
      id: 2,
      question: "Sed ut perspiciatis unde omnis iste natus error?",
      answer:
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
    },
    {
      id: 3,
      question: "Qui officia deserunt mollit anim id est laborum?",
      answer:
        "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
    },
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const renderManualSection = () => (
    <div>
      <h2 className="text-3xl font-bold text-[#333333] mb-6">Manual</h2>
      <div className="space-y-8">
        {/* Getting Started Section */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Getting Started</h3>
          <ul className="space-y-2 list-disc list-inside ml-4">
            <li className="hover:text-[#8B2A2A] cursor-pointer">Overview</li>
            <li className="hover:text-[#8B2A2A] cursor-pointer">System Requirements</li>
            <li className="hover:text-[#8B2A2A] cursor-pointer">Setting Up Your Account</li>
          </ul>
        </section>

        {/* Using the System Section */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Using the System</h3>
          <ul className="space-y-2 list-disc list-inside ml-4">
            <li className="hover:text-[#8B2A2A] cursor-pointer">Dashboard Basics</li>
            <li className="hover:text-[#8B2A2A] cursor-pointer">Managing Your Tasks</li>
            <li className="hover:text-[#8B2A2A] cursor-pointer">Notifications and Reminders</li>
          </ul>
        </section>

        {/* Reports Section */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Reports</h3>
          <ul className="space-y-2 list-disc list-inside ml-4">
            <li className="hover:text-[#8B2A2A] cursor-pointer">Viewing Your Task History</li>
            <li className="hover:text-[#8B2A2A] cursor-pointer">Generating Performance Reports</li>
          </ul>
        </section>

        {/* Account Settings Section */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Account Settings</h3>
          <ul className="space-y-2 list-disc list-inside ml-4">
            <li className="hover:text-[#8B2A2A] cursor-pointer">Updating Profile Information</li>
            <li className="hover:text-[#8B2A2A] cursor-pointer">Password Reset</li>
          </ul>
        </section>
      </div>
    </div>
  )

  const handleEditFAQ = (id: number) => {
    setEditingId(id)
  }

  const handleSaveFAQ = (id: number) => {
    setEditingId(null)
    // Here you would typically save the changes to the backend
  }

  const handleUpdateFAQ = (id: number, field: "question" | "answer", value: string) => {
    setFaqs(faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)))
  }

  const renderFAQSection = () => (
    <div>
      <h2 className="text-3xl font-bold text-[#333333] mb-6">FAQ</h2>
      <div className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.id} className="relative bg-white p-4 rounded-lg shadow">
            {editingId === faq.id ? (
              <>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => handleUpdateFAQ(faq.id, "question", e.target.value)}
                  className="w-full mb-2 p-2 border rounded"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => handleUpdateFAQ(faq.id, "answer", e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <button
                  onClick={() => handleSaveFAQ(faq.id)}
                  className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md"
                >
                  <Save className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg">Q: {faq.question}</h3>
                <p>A: {faq.answer}</p>
                {editMode && (
                  <button
                    onClick={() => handleEditFAQ(faq.id)}
                    className="absolute top-2 right-2 p-1 bg-[#8B2A2A] text-white rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-[160px] bg-[#333333] text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Image src="/placeholder.svg?height=24&width=24" alt="CICS Logo" width={24} height={24} />
            <div className="text-xs leading-tight">
              <div className="font-bold">CICS</div>
              <div className="text-[10px]">Persistent Task Monitoring</div>
              <div className="text-[10px]">and Management System</div>
            </div>
          </div>
        </div>

        <nav className="flex-1">
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">Dashboard</div>
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">Tasks</div>
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">Reports</div>
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">Receivers</div>
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">User</div>
          <div className="py-4 px-6 bg-gray-700 cursor-pointer">Help</div>
          <div className="mt-auto py-4 px-6 hover:bg-gray-700 cursor-pointer">Log Out</div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-8">
          <h1 className="text-5xl font-bold text-[#333333] mb-8">
            Help and Support <span className="text-[#8B2A2A]">Admin</span>
          </h1>

          {/* Search and Navigation */}
          <div className="flex gap-2 mb-8">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 pr-10 bg-[#333333] text-white rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 text-white w-[18px] h-[18px]" />
            </div>
            <button
              className={`px-4 py-2 rounded-md ${activeSection === "faq" ? "bg-[#8B2A2A]" : "bg-[#333333]"} text-white`}
              onClick={() => setActiveSection("faq")}
            >
              FAQ
            </button>
            <button
              className={`px-4 py-2 rounded-md ${activeSection === "manual" ? "bg-[#8B2A2A]" : "bg-[#333333]"} text-white`}
              onClick={() => setActiveSection("manual")}
            >
              Manual
            </button>
            <button
              className={`px-4 py-2 rounded-md ${activeSection === "contact" ? "bg-[#8B2A2A]" : "bg-[#333333]"} text-white`}
              onClick={() => setActiveSection("contact")}
            >
              Contact Support
            </button>
            <button
              className={`px-4 py-2 rounded-md ${editMode ? "bg-green-600" : "bg-[#8B2A2A]"} text-white`}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Save Mode" : "Edit Mode"}
            </button>
          </div>

          {/* Content Section */}
          {activeSection === "faq" && renderFAQSection()}
          {activeSection === "manual" && renderManualSection()}
          {activeSection === "contact" && (
            <div>
              <h2 className="text-3xl font-bold text-[#333333] mb-6">Contact Support</h2>
              {/* Add contact support content here */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

