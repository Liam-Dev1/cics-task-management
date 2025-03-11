"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, ClipboardList, BarChart3, Users, HelpCircle, User, LogOut } from 'lucide-react'
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Tasks", icon: ClipboardList, href: "/tasks" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Receivers", icon: Users, href: "/receivers" },
  { name: "Help", icon: HelpCircle, href: "/help" },
  { name: "User", icon: User, href: "/user" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-[200px] bg-[#333333] text-white flex flex-col min-h-screen">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Image src="/placeholder.svg?height=40&width=40" alt="CICS Logo" width={40} height={40} className="mr-2" />
          <span className="text-sm font-bold">CICS Task Management</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded hover:bg-[#444444] transition-colors",
                  pathname === item.href ? "bg-[#444444]" : "",
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-[#444444]">
        <Link href="/logout">
          <div className="flex items-center px-3 py-2 text-sm rounded hover:bg-[#444444] transition-colors">
            <LogOut className="mr-3 h-4 w-4" />
            Log Out
          </div>
        </Link>
      </div>
    </div>
  )
}

