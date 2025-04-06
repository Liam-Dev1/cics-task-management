"use client"

import { useState } from "react"
import {
  Search,
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  Users,
  HelpCircle,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar-user"

type TabType = "manual" | "faq" | "contact"

export default function UserView() {
  const [activeTab, setActiveTab] = useState<TabType>("manual")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white">
        <h1 className="text-5xl font-bold text-gray-800 mb-8">Help and Support</h1>

        {/* Search and Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <Input type="search" placeholder="Search" className="pr-10 bg-gray-100 border-gray-300 rounded" />
            <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant={activeTab === "faq" ? "default" : "outline"}
            className={activeTab === "faq" ? "bg-red-800 hover:bg-red-900" : "bg-gray-700 text-white hover:bg-gray-800"}
            onClick={() => setActiveTab("faq")}
          >
            FAQ
          </Button>

          <Button
            variant={activeTab === "manual" ? "default" : "outline"}
            className={
              activeTab === "manual" ? "bg-red-800 hover:bg-red-900" : "bg-gray-700 text-white hover:bg-gray-800"
            }
            onClick={() => setActiveTab("manual")}
          >
            Manual
          </Button>

          <Button
            variant={activeTab === "contact" ? "default" : "outline"}
            className={
              activeTab === "contact" ? "bg-red-800 hover:bg-red-900" : "bg-gray-700 text-white hover:bg-gray-800"
            }
            onClick={() => setActiveTab("contact")}
          >
            Contact Support
          </Button>
        </div>

        {/* Content Area */}
        {activeTab === "manual" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Manual</h2>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold mb-2">Getting Started</h3>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Overview</li>
                  <li>System Requirements</li>
                  <li>Setting Up Your Account</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold mb-2">Using the System</h3>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Dashboard Basics</li>
                  <li>Managing Your Tasks</li>
                  <li>Notifications and Reminders</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold mb-2">Reports</h3>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Viewing Your Task History</li>
                  <li>Generating Performance Reports</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold mb-2">Account Settings</h3>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Updating Profile Information</li>
                  <li>Password Reset</li>
                </ul>
              </section>
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">FAQ</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Q: Lorem ipsum dolor sit amet?</h3>
                <p className="mt-2">
                  A: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur mauris vel nulla
                  volutpat, ac ullamcorper sapien ultricies.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold">Q: Sed ut perspiciatis unde omnis iste natus error?</h3>
                <p className="mt-2">
                  A: Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
                  aliquid ex ea commodi consequatur.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold">Q: Qui officia deserunt mollit anim id est laborum?</h3>
                <p className="mt-2">
                  A: Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et
                  voluptates repudiandae sint et molestiae non recusandae.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold">Q: Nisi ut aliquid ex ea commodi consequatur?</h3>
                <p className="mt-2">
                  A: Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
                  magni dolores eos qui ratione voluptatem sequi nesciunt.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Contact Support</h2>
            <div className="max-w-md">
              <form className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block mb-1 font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="Brief description of your issue" />
                </div>
                <div>
                  <label htmlFor="message" className="block mb-1 font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full p-2 border rounded-md"
                    placeholder="Please describe your issue in detail"
                  ></textarea>
                </div>
                <Button className="bg-red-800 hover:bg-red-900">Submit Request</Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}