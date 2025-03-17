"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Edit,
  Trash2,
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

type TabType = "manual" | "faq" | "contact"

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<TabType>("manual")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-[220px]"} bg-[#1e1e1e] text-white flex flex-col transition-all duration-300 ease-in-out relative`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 bg-[#1e1e1e] text-white rounded-full p-1 z-10 border border-gray-700"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Image
                src="/placeholder.svg?height=32&width=32"
                alt="CICS Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <div className="text-sm leading-tight">
                <div className="font-bold">CICS</div>
                <div className="text-xs text-gray-300">Task Management System</div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex justify-center">
              <Image
                src="/placeholder.svg?height=32&width=32"
                alt="CICS Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col py-4">
          <Link href="/dashboard" className="flex items-center px-4 py-3 hover:bg-gray-700 rounded-md mx-2">
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
          </Link>
          <Link href="/tasks" className="flex items-center px-4 py-3 hover:bg-gray-700 rounded-md mx-2">
            <ClipboardList size={20} />
            {!sidebarCollapsed && <span className="ml-3">Tasks</span>}
          </Link>
          <Link href="/reports" className="flex items-center px-4 py-3 hover:bg-gray-700 rounded-md mx-2">
            <BarChart2 size={20} />
            {!sidebarCollapsed && <span className="ml-3">Reports</span>}
          </Link>
          <Link href="/receivers" className="flex items-center px-4 py-3 hover:bg-gray-700 rounded-md mx-2">
            <Users size={20} />
            {!sidebarCollapsed && <span className="ml-3">Receivers</span>}
          </Link>
          <Link href="/help-and-support" className="flex items-center px-4 py-3 bg-gray-700 rounded-md mx-2">
            <HelpCircle size={20} />
            {!sidebarCollapsed && <span className="ml-3">Help</span>}
          </Link>
          <Link href="/user" className="flex items-center px-4 py-3 hover:bg-gray-700 rounded-md mx-2">
            <User size={20} />
            {!sidebarCollapsed && <span className="ml-3">User</span>}
          </Link>

          <div className="flex-1"></div>

          {/* Logout at bottom */}
          <Link href="/logout" className="flex items-center px-4 py-3 hover:bg-gray-700 rounded-md mx-2 mt-auto mb-4">
            <div className="flex items-center">
              {!sidebarCollapsed && (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                  <span className="text-white font-medium">N</span>
                </div>
              )}
              {sidebarCollapsed ? <LogOut size={20} /> : <span>Log Out</span>}
            </div>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold text-gray-800">
            Help and Support <span className="text-red-800 text-3xl ml-2">Admin</span>
          </h1>
          {editMode && (
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              <span className="font-medium">Edit Mode Active</span>
            </div>
          )}
        </div>

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

          <Button
            variant={editMode ? "default" : "outline"}
            className={editMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-600 text-white hover:bg-blue-700"}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Exit Edit Mode" : "Edit Mode"}
          </Button>
        </div>

        {/* Content Area */}
        {activeTab === "manual" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Manual</h2>
              {editMode && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Section
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Getting Started</h3>
                  {editMode && (
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="list-disc pl-8 space-y-1">
                  <li className="group flex items-center">
                    Overview
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  <li className="group flex items-center">
                    System Requirements
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  <li className="group flex items-center">
                    Setting Up Your Account
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  {editMode && (
                    <li>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
                        <Plus className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </li>
                  )}
                </ul>
              </section>

              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Using the System</h3>
                  {editMode && (
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="list-disc pl-8 space-y-1">
                  <li className="group flex items-center">
                    Dashboard Basics
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  <li className="group flex items-center">
                    Managing Your Tasks
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  <li className="group flex items-center">
                    Notifications and Reminders
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  {editMode && (
                    <li>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
                        <Plus className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </li>
                  )}
                </ul>
              </section>

              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Reports</h3>
                  {editMode && (
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="list-disc pl-8 space-y-1">
                  <li className="group flex items-center">
                    Viewing Your Task History
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  <li className="group flex items-center">
                    Generating Performance Reports
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  {editMode && (
                    <li>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
                        <Plus className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </li>
                  )}
                </ul>
              </section>

              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Account Settings</h3>
                  {editMode && (
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="list-disc pl-8 space-y-1">
                  <li className="group flex items-center">
                    Updating Profile Information
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  <li className="group flex items-center">
                    Password Reset
                    {editMode && (
                      <div className="hidden group-hover:flex ml-2 space-x-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-800">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                  {editMode && (
                    <li>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
                        <Plus className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </li>
                  )}
                </ul>
              </section>

              {editMode && (
                <Button className="bg-blue-600 hover:bg-blue-700 mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Add New Section
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">FAQ</h2>
              {editMode && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add FAQ
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div className="group">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">Q: Lorem ipsum dolor sit amet?</h3>
                  {editMode && (
                    <div className="flex space-x-2 mt-1">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-2">
                  A: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur mauris vel nulla
                  volutpat, ac ullamcorper sapien ultricies.
                </p>
              </div>

              <div className="group">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">Q: Sed ut perspiciatis unde omnis iste natus error?</h3>
                  {editMode && (
                    <div className="flex space-x-2 mt-1">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-2">
                  A: Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
                  aliquid ex ea commodi consequatur.
                </p>
              </div>

              <div className="group">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">Q: Qui officia deserunt mollit anim id est laborum?</h3>
                  {editMode && (
                    <div className="flex space-x-2 mt-1">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-2">
                  A: Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et
                  voluptates repudiandae sint et molestiae non recusandae.
                </p>
              </div>

              <div className="group">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">Q: Nisi ut aliquid ex ea commodi consequatur?</h3>
                  {editMode && (
                    <div className="flex space-x-2 mt-1">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
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
      </div>
    </div>
  )
}

