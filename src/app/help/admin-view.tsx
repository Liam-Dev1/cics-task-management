"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sidebar } from "@/components/sidebar-admin"
import { db } from "@/lib/firebase/firebase.config"
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore"

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

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<TabType>("manual")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [openDialog, setOpenDialog] = useState<{ type: string; id?: string } | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Initialize state with empty arrays
  const [manualSections, setManualSections] = useState<ManualSection[]>([])
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo)

  // Store document IDs mapping
  const [docIdMap, setDocIdMap] = useState<Record<string, string>>({})

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

          // Create a mapping of section IDs to document IDs
          const idMapping: Record<string, string> = {}
          sections.forEach((section) => {
            idMapping[section.id] = section.docId || ""
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

          setDocIdMap(idMapping)
          setManualSections(sortedSections)
          console.log("Loaded sections:", sortedSections)
          console.log("Document ID mapping:", idMapping)
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

  // Initialize a collection with default data
  const initializeCollection = async <T extends { id: string }>(collectionRef: any, defaultData: T[]) => {
    try {
      const newIdMapping: Record<string, string> = { ...docIdMap }

      for (const item of defaultData) {
        // For manual sections, ensure items is stored as an array
        const itemWithTimestamp = {
          ...item,
          timestamp: serverTimestamp(),
          // If this is a manual section with items, ensure it's stored as an array
          ...("items" in item
            ? {
                items: Array.isArray((item as any).items) ? [...(item as any).items] : [],
              }
            : {}),
        }

        // Add document to Firestore and get the document reference
        const docRef = doc(collectionRef)
        await setDoc(docRef, itemWithTimestamp)

        // Store the mapping between the item ID and the document ID
        newIdMapping[item.id] = docRef.id
      }

      // Update the document ID mapping
      setDocIdMap(newIdMapping)
    } catch (error) {
      console.error("Error initializing collection:", error)
    }
  }

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    question: "",
    answer: "",
    email: "",
    emailDescription: "",
    responseTime: "",
    phone: "",
    phoneHours: "",
    introText: "",
  })

  // Helper function to check if text contains any of the search words
  const textContainsSearchWords = (text: string, searchWords: string[]): boolean => {
    if (!text) return false
    const lowerText = text.toLowerCase()
    return searchWords.some((word) => lowerText.includes(word))
  }

  // Filtered FAQ entries based on search query
  const filteredFaqEntries = faqEntries.filter((faq) => {
    if (!searchQuery) return true

    const searchWords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    if (searchWords.length === 0) return true

    return textContainsSearchWords(faq.question, searchWords) || textContainsSearchWords(faq.answer, searchWords)
  })

  // Filtered manual sections based on search query
  const filteredManualSections = manualSections.filter((section) => {
    if (!searchQuery) return true

    const searchWords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    if (searchWords.length === 0) return true

    const titleMatch = textContainsSearchWords(section.title, searchWords)
    const itemsMatch = section.items.some((item) => textContainsSearchWords(item, searchWords))

    return titleMatch || itemsMatch
  })

  // Check if contact info matches search query
  const hasContactMatch = (): boolean => {
    if (!searchQuery) return true

    const searchWords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    if (searchWords.length === 0) return true

    return (
      textContainsSearchWords(contactInfo.introText, searchWords) ||
      textContainsSearchWords(contactInfo.email, searchWords) ||
      textContainsSearchWords(contactInfo.emailDescription, searchWords) ||
      textContainsSearchWords(contactInfo.responseTime, searchWords) ||
      textContainsSearchWords(contactInfo.phone, searchWords) ||
      textContainsSearchWords(contactInfo.phoneHours, searchWords)
    )
  }

  // Get the document ID for a section
  const getDocumentId = (sectionId: string): string => {
    // First check if the section has a docId property
    const section = manualSections.find((s) => s.id === sectionId)
    if (section && section.docId) {
      return section.docId
    }

    // Then check the mapping
    if (docIdMap[sectionId]) {
      return docIdMap[sectionId]
    }

    // If not found, return the section ID itself (fallback)
    return sectionId
  }

  // Handle deleting a FAQ entry
  const handleDeleteFaq = async (id: string) => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        const docId = faqEntries.find((f) => f.id === id)?.docId || id
        await deleteDoc(doc(faqEntriesCollection, docId))
        const updatedFaqs = faqEntries.filter((faq) => faq.id !== id)
        setFaqEntries(updatedFaqs)
      } catch (error) {
        console.error("Error deleting FAQ:", error)
      }
    }
  }

  // Handle deleting a manual section
  const handleDeleteSection = async (id: string) => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this section?")) {
      try {
        const docId = getDocumentId(id)
        await deleteDoc(doc(manualSectionsCollection, docId))
        const updatedSections = manualSections.filter((section) => section.id !== id)
        setManualSections(updatedSections)
      } catch (error) {
        console.error("Error deleting section:", error)
      }
    }
  }

  // Handle deleting a manual item
  const handleDeleteItem = async (sectionId: string, itemIndex: number) => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const section = manualSections.find((s) => s.id === sectionId)
        if (section) {
          const newItems = [...section.items]
          newItems.splice(itemIndex, 1)

          const docId = getDocumentId(sectionId)
          const updatedSection = { ...section, items: newItems, timestamp: serverTimestamp() }
          await updateDoc(doc(manualSectionsCollection, docId), updatedSection)

          const updatedSections = manualSections.map((s) => {
            if (s.id === sectionId) {
              return { ...s, items: newItems }
            }
            return s
          })
          setManualSections(updatedSections)
        }
      } catch (error) {
        console.error("Error deleting item:", error)
      }
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
      try {
        // Parse the ID to get section ID and item index
        const parts = id.split("-")
        if (parts.length !== 2) {
          console.error("Invalid item ID format:", id)
          return
        }

        const sectionId = parts[0]
        const itemIndex = Number.parseInt(parts[1], 10)

        if (isNaN(itemIndex)) {
          console.error("Invalid item index:", parts[1])
          return
        }

        const section = manualSections.find((s) => s.id === sectionId)
        if (section && section.items[itemIndex]) {
          setEditForm({
            ...editForm,
            content: section.items[itemIndex],
          })
        } else {
          console.error("Section or item not found:", sectionId, itemIndex)
        }
      } catch (error) {
        console.error("Error setting up edit item form:", error)
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
    } else if (type === "editContact") {
      setEditForm({
        ...editForm,
        email: contactInfo.email,
        emailDescription: contactInfo.emailDescription,
        responseTime: contactInfo.responseTime,
        phone: contactInfo.phone,
        phoneHours: contactInfo.phoneHours,
        introText: contactInfo.introText,
      })
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
    } else if (type === "addItem" && id) {
      setEditForm({
        ...editForm,
        content: "",
      })
    }
  }

  // Handle closing dialog
  const handleCloseDialog = () => {
    setOpenDialog(undefined)
  }

  // Handle saving edits
  const handleSave = async () => {
    if (!openDialog) return

    try {
      if (openDialog.type === "editSection" && openDialog.id) {
        const currentSection = manualSections.find((s) => s.id === openDialog.id)
        if (currentSection) {
          const docId = getDocumentId(openDialog.id)
          console.log("Editing section with document ID:", docId)

          const updatedSection = {
            ...currentSection,
            title: editForm.title,
            timestamp: serverTimestamp(),
          }

          await setDoc(doc(manualSectionsCollection, docId), updatedSection)

          const updatedSections = manualSections.map((section) =>
            section.id === openDialog.id ? { ...section, title: editForm.title } : section,
          )
          setManualSections(updatedSections)
        }
      } else if (openDialog.type === "editItem" && openDialog.id) {
        try {
          // Parse the ID to get section ID and item index
          const parts = openDialog.id.split("-")
          if (parts.length !== 2) {
            throw new Error("Invalid item ID format")
          }

          const sectionId = parts[0]
          const itemIndex = Number.parseInt(parts[1], 10)

          if (isNaN(itemIndex)) {
            throw new Error("Invalid item index")
          }

          console.log("Editing item:", sectionId, itemIndex, editForm.content)

          // Find the section in our local state
          const section = manualSections.find((s) => s.id === sectionId)
          if (!section) {
            throw new Error(`Section with ID ${sectionId} not found`)
          }

          // Get the actual document ID
          const docId = getDocumentId(sectionId)
          console.log("Document ID for section:", docId)

          // Fetch the current document to ensure we have the latest data
          const docRef = doc(manualSectionsCollection, docId)
          const docSnap = await getDoc(docRef)

          if (!docSnap.exists()) {
            throw new Error(`Document with ID ${docId} not found`)
          }

          const currentData = docSnap.data()
          console.log("Current document data:", currentData)

          // Create a new items array with the updated item
          const newItems = Array.isArray(currentData.items) ? [...currentData.items] : []
          if (itemIndex >= 0 && itemIndex < newItems.length) {
            newItems[itemIndex] = editForm.content
          } else {
            throw new Error(`Item index ${itemIndex} out of bounds`)
          }

          // Create the updated section object
          const updatedSection = {
            ...currentData,
            items: newItems,
            timestamp: serverTimestamp(),
          }

          console.log("Updating section:", updatedSection)

          // Update in Firestore
          await updateDoc(docRef, { items: newItems, timestamp: serverTimestamp() })

          // Update local state
          setManualSections(manualSections.map((s) => (s.id === sectionId ? { ...s, items: newItems } : s)))

          console.log("Update successful")
        } catch (error) {
          console.error("Error updating item:", error)
          alert("An error occurred while saving the item. Please try again.")
        }
      } else if (openDialog.type === "editFaq" && openDialog.id) {
        const faq = faqEntries.find((f) => f.id === openDialog.id)
        if (!faq) {
          throw new Error(`FAQ with ID ${openDialog.id} not found`)
        }

        const docId = faq.docId || openDialog.id

        const updatedFaq = {
          id: openDialog.id,
          question: editForm.question,
          answer: editForm.answer,
          timestamp: serverTimestamp(),
        }

        await setDoc(doc(faqEntriesCollection, docId), updatedFaq)

        const updatedFaqs = faqEntries.map((faq) =>
          faq.id === openDialog.id ? { ...faq, question: editForm.question, answer: editForm.answer } : faq,
        )
        setFaqEntries(updatedFaqs)
      } else if (openDialog.type === "editContact") {
        const updatedContactInfo = {
          ...contactInfo,
          email: editForm.email,
          emailDescription: editForm.emailDescription,
          responseTime: editForm.responseTime,
          phone: editForm.phone,
          phoneHours: editForm.phoneHours,
          introText: editForm.introText,
          timestamp: serverTimestamp(),
        }

        await setDoc(doc(contactInfoCollection, contactInfo.docId || "contact-info"), updatedContactInfo)
        setContactInfo(updatedContactInfo)
      } else if (openDialog.type === "addSection") {
        const newId = (Math.max(0, ...manualSections.map((s) => Number.parseInt(s.id))) + 1).toString()

        const newSection = {
          id: newId,
          title: editForm.title,
          items: [],
          timestamp: serverTimestamp(),
        }

        // Add document to Firestore and get the document reference
        const docRef = doc(manualSectionsCollection)
        await setDoc(docRef, newSection)

        // Update the document ID mapping
        setDocIdMap({
          ...docIdMap,
          [newId]: docRef.id,
        })

        const updatedSections = [...manualSections, { ...newSection, docId: docRef.id }]
        setManualSections(updatedSections)
      } else if (openDialog.type === "addFaq") {
        const newId = (Math.max(0, ...faqEntries.map((f) => Number.parseInt(f.id))) + 1).toString()

        const newFaq = {
          id: newId,
          question: editForm.question,
          answer: editForm.answer,
          timestamp: serverTimestamp(),
        }

        // Add document to Firestore and get the document reference
        const docRef = doc(faqEntriesCollection)
        await setDoc(docRef, newFaq)

        const updatedFaqs = [...faqEntries, { ...newFaq, docId: docRef.id }]
        setFaqEntries(updatedFaqs)
      } else if (openDialog.type === "addItem" && openDialog.id) {
        const section = manualSections.find((s) => s.id === openDialog.id)
        if (section) {
          const newItems = [...section.items, editForm.content]

          const docId = getDocumentId(openDialog.id)
          const updatedSection = { ...section, items: newItems, timestamp: serverTimestamp() }
          await setDoc(doc(manualSectionsCollection, docId), updatedSection)

          const updatedSections = manualSections.map((s) => {
            if (s.id === openDialog.id) {
              return { ...s, items: newItems }
            }
            return s
          })
          setManualSections(updatedSections)
        }
      }
    } catch (error) {
      console.error("Error saving data:", error)
      alert("An error occurred while saving. Please try again.")
    }

    handleCloseDialog()
  }

  // Handle adding a new item to a manual section
  const handleAddItem = (sectionId: string) => {
    handleOpenDialog("addItem", sectionId)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
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
                  ? "bg-[#8B0080] hover:bg-[#6B0000] text-white"
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

            {/* Only show Edit Mode button when not in Contact Support tab */}
            {activeTab !== "contact" && (
              <Button
                variant="default"
                className="bg-[#8B0000] hover:bg-[#6B0000] text-white ml-auto"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? "Exit Edit Mode" : "Edit Mode"}
              </Button>
            )}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Manual</h2>
              {editMode && (
                <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => handleOpenDialog("addSection")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Section
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {filteredManualSections.map((section) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 p-0"
                          onClick={() => handleAddItem(section.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Item
                        </Button>
                      </li>
                    )}
                  </ul>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">FAQ</h2>
              {editMode && (
                <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => handleOpenDialog("addFaq")}>
                  <Plus className="h-4 w-4 mr-2" /> Add FAQ
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {filteredFaqEntries.length > 0 ? (
                filteredFaqEntries.map((faq) => (
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Contact Support</h2>
              <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => handleOpenDialog("editContact")}>
                <Edit className="h-4 w-4 mr-2" /> Edit Contact Info
              </Button>
            </div>

            <div className="prose max-w-none">
              {(!searchQuery ||
                textContainsSearchWords(
                  contactInfo.introText,
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                )) && <p className="text-lg">{contactInfo.introText}</p>}

              {/* Email Support Section */}
              {(!searchQuery ||
                textContainsSearchWords(
                  "Email Support",
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                ) ||
                textContainsSearchWords(
                  contactInfo.email,
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                ) ||
                textContainsSearchWords(
                  contactInfo.emailDescription,
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                ) ||
                textContainsSearchWords(
                  contactInfo.responseTime,
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                )) && (
                <>
                  <h3 className="text-xl font-bold mt-6">1. Email Support</h3>
                  <ul className="pl-8 list-disc">
                    {(!searchQuery ||
                      textContainsSearchWords(
                        contactInfo.emailDescription,
                        searchQuery
                          .toLowerCase()
                          .split(/\s+/)
                          .filter((word) => word.length > 0),
                      )) && <li>{contactInfo.emailDescription}</li>}
                    {(!searchQuery ||
                      textContainsSearchWords(
                        contactInfo.responseTime,
                        searchQuery
                          .toLowerCase()
                          .split(/\s+/)
                          .filter((word) => word.length > 0),
                      )) && <li>Response Time: {contactInfo.responseTime}</li>}
                  </ul>
                </>
              )}

              {/* Phone Support Section */}
              {(!searchQuery ||
                textContainsSearchWords(
                  "Phone Support",
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                ) ||
                textContainsSearchWords(
                  contactInfo.phone,
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                ) ||
                textContainsSearchWords(
                  contactInfo.phoneHours,
                  searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((word) => word.length > 0),
                )) && (
                <>
                  <h3 className="text-xl font-bold mt-6">2. Phone Support</h3>
                  <ul className="pl-8 list-disc">
                    {(!searchQuery ||
                      textContainsSearchWords(
                        contactInfo.phone,
                        searchQuery
                          .toLowerCase()
                          .split(/\s+/)
                          .filter((word) => word.length > 0),
                      )) && <li>Call our support line at {contactInfo.phone}.</li>}
                    {(!searchQuery ||
                      textContainsSearchWords(
                        contactInfo.phoneHours,
                        searchQuery
                          .toLowerCase()
                          .split(/\s+/)
                          .filter((word) => word.length > 0),
                      )) && <li>{contactInfo.phoneHours}</li>}
                  </ul>
                </>
              )}

              {searchQuery && !hasContactMatch() && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No contact information found matching your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Dialogs */}
        <Dialog open={!!openDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {openDialog?.type === "editSection" && "Edit Section"}
                {openDialog?.type === "editItem" && "Edit Item"}
                {openDialog?.type === "editFaq" && "Edit FAQ"}
                {openDialog?.type === "editContact" && "Edit Contact Information"}
                {openDialog?.type === "addSection" && "Add New Section"}
                {openDialog?.type === "addFaq" && "Add New FAQ"}
                {openDialog?.type === "addItem" && "Add New Item"}
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

            {(openDialog?.type === "editItem" || openDialog?.type === "addItem") && (
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

            {openDialog?.type === "editContact" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="introText" className="text-sm font-medium">
                    Introduction Text
                  </label>
                  <Textarea
                    id="introText"
                    rows={3}
                    value={editForm.introText}
                    onChange={(e) => setEditForm({ ...editForm, introText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="emailDescription" className="text-sm font-medium">
                    Email Description
                  </label>
                  <Textarea
                    id="emailDescription"
                    rows={2}
                    value={editForm.emailDescription}
                    onChange={(e) => setEditForm({ ...editForm, emailDescription: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="responseTime" className="text-sm font-medium">
                    Response Time
                  </label>
                  <Input
                    id="responseTime"
                    value={editForm.responseTime}
                    onChange={(e) => setEditForm({ ...editForm, responseTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phoneHours" className="text-sm font-medium">
                    Phone Hours
                  </label>
                  <Input
                    id="phoneHours"
                    value={editForm.phoneHours}
                    onChange={(e) => setEditForm({ ...editForm, phoneHours: e.target.value })}
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

