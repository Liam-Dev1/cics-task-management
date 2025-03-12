"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, ClipboardList, BarChart3, Users, HelpCircle, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Tasks", icon: ClipboardList, href: "/admintask" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Receivers", icon: Users, href: "/" },
  { name: "Help", icon: HelpCircle, href: "/help" },
  { name: "User", icon: User, href: "/user" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-zinc-800 text-white flex flex-col min-h-screen">
      <div className="p-4 mb-8">
        <Image src="/images/CICSTASKMGMT_LOGO.png" alt="CICS Logo" width={150} height={50} className="mb-12" />

        <nav className="space-y-4">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white hover:bg-zinc-700 text-lg py-3",
                  pathname === item.href && "bg-zinc-700",
                )}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-700 text-lg py-3">
          <LogOut className="mr-3 h-6 w-6" />
          Log Out
        </Button>
      </div>
    </div>
  )
}
