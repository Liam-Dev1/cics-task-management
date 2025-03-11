import Image from "next/image"
import { Search } from "lucide-react"
import Link from "next/link"

export default function Manual() {
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
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">User</div>
          <div className="py-4 px-6 bg-gray-700 cursor-pointer">Help</div>
          <div className="mt-auto py-4 px-6 hover:bg-gray-700 cursor-pointer">Log Out</div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-5xl font-bold text-[#333333] mb-8">Help and Support</h1>

          {/* Search and Navigation */}
          <div className="flex gap-2 mb-8">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 pr-10 bg-[#333333] text-white rounded-md"
              />
              <Search className="absolute right-3 top-2.5 text-white w-[18px] h-[18px]" />
            </div>
            <Link href="/help/faq" className="px-4 py-2 bg-[#333333] text-white rounded-md">
              FAQ
            </Link>
            <Link href="/help/manual" className="px-4 py-2 bg-[#8B2A2A] text-white rounded-md">
              Manual
            </Link>
            <Link href="/help/contact" className="px-4 py-2 bg-[#333333] text-white rounded-md">
              Contact Support
            </Link>
          </div>

          {/* Manual Content */}
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
        </div>
      </div>
    </div>
  )
}

