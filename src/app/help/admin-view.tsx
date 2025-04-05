"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar-admin"
import { db } from"@/app/firebase/firebase.config"
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

type TabType = "manual" | "faq" | "contact" | "manage"
type TicketStatus = "New" | "Pending" | "In Progress" | "Resolved" | "Closed"

interface Ticket {
  id: string
  user: string
  subject: string
  status: TicketStatus
  date: string
  description?: string
  timestamp?: any
}

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

// Initial data for manual sections
const initialManualSections: ManualSection[] = [
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
]

// Initial data for FAQ entries
const initialFaqEntries: FaqEntry[] = [
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
]

// Initial data for support tickets
const initialSupportTickets: Ticket[] = [
  {
    id: "#1234",
    user: "john.doe@example.com",
    subject: "Cannot access dashboard",
    status: "Pending",
    date: "2023-05-12",
    description: "I'm having trouble accessing the dashboard after the recent update.",
  },
  {
    id: "#1233",
    user: "jane.smith@example.com",
    subject: "Task not saving",
    status: "Resolved",
    date: "2023-05-10",
    description: "When I try to save my tasks, I get an error message.",
  },
]

// Firestore collection references
const manualSectionsCollection = collection(db, "help", "manual", "sections")
const faqEntriesCollection = collection(db, "help", "faq", "entries")
const supportTicketsCollection = collection(db, "help", "support", "tickets")

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<TabType>("faq")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [openDialog, setOpenDialog] = useState<{ type: string; id?: string } | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Initialize state with default values
  const [manualSections, setManualSections] = useState<ManualSection[]>(initialManualSections)
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>(initialFaqEntries)
  const [supportTickets, setSupportTickets] = useState<Ticket[]>(initialSupportTickets)

  // Store document IDs mapping
  const [docIdMap, setDocIdMap] = useState<Record<string, string>>({})

  // Load data from Firestore on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load manual sections
        const sectionsSnapshot = await getDocs(query(manualSectionsCollection, orderBy("timestamp", "desc")))
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

          setDocIdMap(idMapping)
          setManualSections(sections)
          console.log("Loaded sections:", sections)
          console.log("Document ID mapping:", idMapping)
        } else {
          // Initialize with default data if collection is empty
          await initializeCollection(manualSectionsCollection, initialManualSections)
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
        } else {
          // Initialize with default data if collection is empty
          await initializeCollection(faqEntriesCollection, initialFaqEntries)
        }

        // Load support tickets
        const ticketsSnapshot = await getDocs(supportTicketsCollection)
        if (!ticketsSnapshot.empty) {
          const tickets = ticketsSnapshot.docs.map((doc) => doc.data() as Ticket)

          // Sort tickets by their numeric ID (extract number from #X format)
          tickets.sort((a, b) => {
            const aNum = Number.parseInt(a.id.replace("#", ""))
            const bNum = Number.parseInt(b.id.replace("#", ""))
            return bNum - aNum // Descending order (newest first)
          })

          setSupportTickets(tickets)
        } else {
          // Initialize with default data if collection is empty
          await initializeCollection(supportTicketsCollection, initialSupportTickets)
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
    ticketUser: "",
    ticketSubject: "",
    ticketStatus: "New" as TicketStatus,
    ticketDescription: "",
  })

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

  // Filtered support tickets based on search query
  const filteredSupportTickets = supportTickets.filter(
    (ticket) =>
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.description && ticket.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

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

  // Handle deleting a ticket
  const handleDeleteTicket = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await deleteDoc(doc(supportTicketsCollection, id))
        const updatedTickets = supportTickets.filter((ticket) => ticket.id !== id)
        setSupportTickets(updatedTickets)
      } catch (error) {
        console.error("Error deleting ticket:", error)
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
    } else if (type === "addTicket") {
      // Get the current user's email if available (for future implementation)
      const userEmail = "" // This would be populated from auth context in a real implementation

      setEditForm({
        ...editForm,
        ticketUser: userEmail,
        ticketSubject: "",
        ticketStatus: "New", // Default to "New"
        ticketDescription: "",
      })
    } else if (type === "editTicket" && id) {
      const ticket = supportTickets.find((t) => t.id === id)
      if (ticket) {
        setEditForm({
          ...editForm,
          ticketUser: ticket.user,
          ticketSubject: ticket.subject,
          ticketStatus: ticket.status,
          ticketDescription: ticket.description || "",
        })
      }
    } else if (type === "viewTicket" && id) {
      const ticket = supportTickets.find((t) => t.id === id)
      if (ticket) {
        setEditForm({
          ...editForm,
          ticketUser: ticket.user,
          ticketSubject: ticket.subject,
          ticketStatus: ticket.status,
          ticketDescription: ticket.description || "",
        })
      }
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
      } else if (openDialog.type === "addTicket") {
        try {
          // Get all existing tickets to determine the next ID
          const ticketsSnapshot = await getDocs(supportTicketsCollection)

          // Find the highest ticket number
          let highestTicketNum = 0

          ticketsSnapshot.docs.forEach((doc) => {
            const ticketId = doc.id
            if (ticketId.startsWith("#")) {
              const ticketNum = Number.parseInt(ticketId.substring(1))
              if (!isNaN(ticketNum) && ticketNum > highestTicketNum) {
                highestTicketNum = ticketNum
              }
            }
          })

          // Next ticket ID is one higher than the current highest
          const nextTicketNum = highestTicketNum + 1
          const newId = `#${nextTicketNum}`

          // Create new ticket
          const newTicket: Ticket = {
            id: newId,
            user: editForm.ticketUser,
            subject: editForm.ticketSubject,
            status: "New", // Always use "New" for new tickets
            date: new Date().toISOString().split("T")[0],
            description: editForm.ticketDescription,
            timestamp: serverTimestamp(),
          }

          await setDoc(doc(supportTicketsCollection, newId), newTicket)

          // Add to tickets and sort them
          const updatedTickets = [newTicket, ...supportTickets]
          // Sort tickets by their numeric ID
          updatedTickets.sort((a, b) => {
            const aNum = Number.parseInt(a.id.replace("#", ""))
            const bNum = Number.parseInt(b.id.replace("#", ""))
            return bNum - aNum // Descending order (newest first)
          })

          setSupportTickets(updatedTickets)
        } catch (error) {
          console.error("Error adding ticket:", error)
          alert("An error occurred while saving. Please try again.")
        }
      } else if (openDialog.type === "editTicket" && openDialog.id) {
        // Update existing ticket
        const updatedTicket = {
          id: openDialog.id,
          user: editForm.ticketUser,
          subject: editForm.ticketSubject,
          status: editForm.ticketStatus,
          date: supportTickets.find((t) => t.id === openDialog.id)?.date || new Date().toISOString().split("T")[0],
          description: editForm.ticketDescription,
          timestamp: serverTimestamp(),
        }

        await setDoc(doc(supportTicketsCollection, openDialog.id), updatedTicket)

        const updatedTickets = supportTickets.map((ticket) =>
          ticket.id === openDialog.id
            ? {
                ...ticket,
                user: editForm.ticketUser,
                subject: editForm.ticketSubject,
                status: editForm.ticketStatus,
                description: editForm.ticketDescription,
              }
            : ticket,
        )
        setSupportTickets(updatedTickets)
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
              <h2 className="text-3xl font-bold">Support Tickets</h2>
              <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => handleOpenDialog("addTicket")}>
                <Plus className="h-4 w-4 mr-2" /> Add New Ticket
              </Button>
            </div>

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
                  {filteredSupportTickets.map((ticket, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ticket.status === "Resolved"
                              ? "bg-green-100 text-green-800"
                              : ticket.status === "New"
                                ? "bg-blue-100 text-blue-800"
                                : ticket.status === "In Progress"
                                  ? "bg-purple-100 text-purple-800"
                                  : ticket.status === "Closed"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleOpenDialog("viewTicket", ticket.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-800"
                            onClick={() => handleOpenDialog("editTicket", ticket.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSupportTickets.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No support tickets found matching your search criteria.</p>
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
                {openDialog?.type === "addSection" && "Add New Section"}
                {openDialog?.type === "addFaq" && "Add New FAQ"}
                {openDialog?.type === "addItem" && "Add New Item"}
                {openDialog?.type === "addTicket" && "Add New Support Ticket"}
                {openDialog?.type === "editTicket" && "Edit Support Ticket"}
                {openDialog?.type === "viewTicket" && "View Support Ticket"}
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

            {openDialog?.type === "addTicket" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="ticketUser" className="text-sm font-medium">
                    User Email
                  </label>
                  <Input
                    id="ticketUser"
                    type="email"
                    value={editForm.ticketUser}
                    onChange={(e) => setEditForm({ ...editForm, ticketUser: e.target.value })}
                    list="userEmails"
                  />
                  <datalist id="userEmails">
                    <option value="liamkeith.mariano.cics@ust.edu.ph" />
                    <option value="lebronjames@gmail.com" />
                    <option value="john.doe@example.com" />
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label htmlFor="ticketSubject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="ticketSubject"
                    value={editForm.ticketSubject}
                    onChange={(e) => setEditForm({ ...editForm, ticketSubject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ticketStatus" className="text-sm font-medium">
                    Status
                  </label>
                  <Input id="ticketStatus" value="New" disabled className="bg-gray-100" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ticketDescription" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="ticketDescription"
                    rows={4}
                    value={editForm.ticketDescription}
                    onChange={(e) => setEditForm({ ...editForm, ticketDescription: e.target.value })}
                  />
                </div>
              </div>
            )}

            {openDialog?.type === "editTicket" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="ticketUser" className="text-sm font-medium">
                    User Email
                  </label>
                  <Input
                    id="ticketUser"
                    type="email"
                    value={editForm.ticketUser}
                    onChange={(e) => setEditForm({ ...editForm, ticketUser: e.target.value })}
                    list="userEmails"
                  />
                  <datalist id="userEmails">
                    <option value="liamkeith.mariano.cics@ust.edu.ph" />
                    <option value="lebronjames@gmail.com" />
                    <option value="john.doe@example.com" />
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label htmlFor="ticketSubject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="ticketSubject"
                    value={editForm.ticketSubject}
                    onChange={(e) => setEditForm({ ...editForm, ticketSubject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ticketStatus" className="text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={editForm.ticketStatus}
                    onValueChange={(value) => setEditForm({ ...editForm, ticketStatus: value as TicketStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="ticketDescription" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="ticketDescription"
                    rows={4}
                    value={editForm.ticketDescription}
                    onChange={(e) => setEditForm({ ...editForm, ticketDescription: e.target.value })}
                  />
                </div>
              </div>
            )}

            {openDialog?.type === "viewTicket" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Email</label>
                  <p className="p-2 bg-gray-50 rounded-md">{editForm.ticketUser}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <p className="p-2 bg-gray-50 rounded-md">{editForm.ticketSubject}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <p className="p-2 bg-gray-50 rounded-md">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        editForm.ticketStatus === "Resolved"
                          ? "bg-green-100 text-green-800"
                          : editForm.ticketStatus === "New"
                            ? "bg-blue-100 text-blue-800"
                            : editForm.ticketStatus === "In Progress"
                              ? "bg-purple-100 text-purple-800"
                              : editForm.ticketStatus === "Closed"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {editForm.ticketStatus}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <p className="p-2 bg-gray-50 rounded-md whitespace-pre-wrap">{editForm.ticketDescription}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                {openDialog?.type === "viewTicket" ? "Close" : "Cancel"}
              </Button>
              {openDialog?.type !== "viewTicket" && (
                <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={handleSave}>
                  Save
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

