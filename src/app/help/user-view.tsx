"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar-user"
import { db } from "@/lib/firebase/firebase.config"
import { collection, getDocs, doc, setDoc, query, orderBy, serverTimestamp } from "firebase/firestore"

type TabType = "manual" | "faq" | "contact"

interface ManualSection {
  id: string
  title: string
  items: string[]
  timestamp?: any
  docId?: string // Store the actual Firestore document ID
}

interface FaqEntry {
  id: string
  question: string
  answer: string
  timestamp?: any
  docId?: string // Store the actual Firestore document ID
}

interface ContactInfo {
  id: string
  email: string
  emailDescription: string
  responseTime: string
  phone: string
  phoneHours: string
  introText: string
  timestamp?: any
  docId?: string
}

// Firestore collection references
const manualSectionsCollection = collection(db, "help", "manual", "sections")
const faqEntriesCollection = collection(db, "help", "faq", "entries")
const contactInfoCollection = collection(db, "help", "contact", "info")

// Default contact information
const defaultContactInfo: ContactInfo = {
  id: "contact-info",
  email: "support@example.com",
  emailDescription: "Send an email to support@example.com with a detailed description of the issue you're facing.",
  responseTime: "Our team typically replies within 24-48 hours.",
  phone: "1-800-123-4567",
  phoneHours: "Available Monday to Friday, 9:00 AM - 5:00 PM.",
  introText:
    "If you need assistance with the system or encounter any issues, our support team is here to help. You can reach out using the following methods:",
}

// Manual section order mapping
const sectionOrderMap: Record<string, number> = {
  "cics-task-management-system-overview": 1,
  "using-the-dashboard": 2,
  "managing-tasks": 3,
  "task-verification-process": 4,
  "generating-reports": 5,
  "user-management": 6,
  "understanding-notifications": 7,
}

export default function UserView() {
  const [activeTab, setActiveTab] = useState<TabType>("manual")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Initialize state with empty arrays
  const [manualSections, setManualSections] = useState<ManualSection[]>([])
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo)

  // Load data from Firestore on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load manual sections
        const sectionsSnapshot = await getDocs(manualSectionsCollection)
        if (!sectionsSnapshot.empty) {
          const sections = sectionsSnapshot.docs.map((doc) => {
            const data = doc.data()
            // Ensure items is always an array
            return {
              ...data,
              items: Array.isArray(data.items) ? data.items : [],
              docId: doc.id, // Store the actual Firestore document ID
            } as ManualSection
          })

          // Sort sections based on predefined order or alphabetically if not in the map
          const sortedSections = [...sections].sort((a, b) => {
            const orderA = sectionOrderMap[a.id] || 999
            const orderB = sectionOrderMap[b.id] || 999

            if (orderA !== orderB) {
              return orderA - orderB
            }

            // If both sections are not in the order map or have the same order, sort alphabetically
            return a.title.localeCompare(b.title)
          })

          setManualSections(sortedSections)
          console.log("Loaded sections:", sortedSections)
        }

        // Load FAQ entries
        const faqSnapshot = await getDocs(query(faqEntriesCollection, orderBy("timestamp", "desc")))
        if (!faqSnapshot.empty) {
          const faqs = faqSnapshot.docs.map(
            (doc) =>
              ({
                ...doc.data(),
                docId: doc.id,
              }) as FaqEntry,
          )
          setFaqEntries(faqs)
        }

        // Load contact information
        const contactSnapshot = await getDocs(contactInfoCollection)
        if (!contactSnapshot.empty) {
          const contactData = contactSnapshot.docs[0].data() as ContactInfo
          setContactInfo({
            ...contactData,
            docId: contactSnapshot.docs[0].id,
          })
        } else {
          // Initialize with default contact info if not found
          const docRef = doc(contactInfoCollection, "contact-info")
          await setDoc(docRef, {
            ...defaultContactInfo,
            timestamp: serverTimestamp(),
          })
          setContactInfo({
            ...defaultContactInfo,
            docId: "contact-info",
          })
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtered FAQ entries based on search query
  const filteredFaqEntries = faqEntries.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filtered manual sections based on search query
  const filteredManualSections = manualSections.filter((section) => {
    const titleMatch = section.title.toLowerCase().includes(searchQuery.toLowerCase())
    const itemsMatch = section.items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
    return titleMatch || itemsMatch
  })

  // Filter contact info based on search query
  const filteredContactInfo = searchQuery
    ? contactInfo.introText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactInfo.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactInfo.emailDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactInfo.responseTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactInfo.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactInfo.phoneHours.toLowerCase().includes(searchQuery.toLowerCase())
      ? contactInfo
      : null
    : contactInfo

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="flex min-h-screen">
    {/* Main Content */}
    <div className="flex-1 p-8 bg-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold text-gray-800">Help and Support</h1>
        </div>

        {/* Search and Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className="relative w-full sm:w-auto sm:min-w-[300px] mb-4">
            <Input
              type="search"
              placeholder="Search"
              className="pr-10 bg-gray-100 border-gray-300 rounded"
              value={searchQuery}
              onChange={handleSearchChange}
            />
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
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B0000]"></div>
          </div>
        )}

        {/* Content Area */}
        {!isLoading && activeTab === "manual" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Manual</h2>
            <div className="space-y-6">
              {filteredManualSections.map((section) => (
                <section key={section.id}>
                  <h3 className="text-xl font-bold mb-2">{section.title}</h3>
                  <div>
                    {section.items.map((item, index) => (
                      <div key={`${section.id}-${index}`} className="flex items-start">
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
              {filteredManualSections.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No manual sections found matching your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && activeTab === "faq" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">FAQ</h2>
            <div className="space-y-6">
              {filteredFaqEntries.length > 0 ? (
                filteredFaqEntries.map((faq) => (
                  <div key={faq.id}>
                    <h3 className="text-xl font-bold">Q: {faq.question}</h3>
                    <p className="mt-2">A: {faq.answer}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No FAQs found matching your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && activeTab === "contact" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Contact Support</h2>

            {filteredContactInfo ? (
              <div className="prose max-w-none">
                <p className="text-lg">{filteredContactInfo.introText}</p>

                <h3 className="text-xl font-bold mt-6">1. Email Support</h3>
                <ul className="pl-8 list-disc">
                  <li>{filteredContactInfo.emailDescription}</li>
                  <li>Response Time: {filteredContactInfo.responseTime}</li>
                </ul>

                <h3 className="text-xl font-bold mt-6">2. Phone Support</h3>
                <ul className="pl-8 list-disc">
                  <li>Call our support line at {filteredContactInfo.phone}.</li>
                  <li>{filteredContactInfo.phoneHours}</li>
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No contact information found matching your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
