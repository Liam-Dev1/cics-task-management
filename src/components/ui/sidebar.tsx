"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, ClipboardList, BarChart3, Users, HelpCircle, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Tasks", icon: ClipboardList, href: "/tasks" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Receivers", icon: Users, href: "/" },
  { name: "Help", icon: HelpCircle, href: "/help" },
  { name: "User", icon: User, href: "/user" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isPortrait, setIsPortrait] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    checkOrientation()
    window.addEventListener("resize", checkOrientation)

    return () => {
      window.removeEventListener("resize", checkOrientation)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 1366) // 1366px is approximately 75% of 1920px (common desktop width)
    }

    handleResize() // Initial check
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "bg-zinc-800 text-white flex flex-col h-screen transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 mb-8">
        <Image
          src="/images/CICSTASKMGMT_LOGO.png"
          alt="CICS Logo"
          width={150}
          height={50}
          className={cn("mb-12 transition-all duration-300", isCollapsed ? "w-8 h-8" : "w-[150px] h-[50px]")}
        />

        <nav className="space-y-4">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white hover:bg-zinc-700 text-lg py-3",
                  pathname === item.href && "bg-zinc-700",
                  isCollapsed && "px-0 justify-center",
                )}
              >
                <item.icon className={cn("h-6 w-6", isCollapsed ? "mr-0" : "mr-3")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-white hover:bg-zinc-700 text-lg py-3",
            isCollapsed && "px-0 justify-center",
          )}
        >
          <LogOut className={cn("h-6 w-6", isCollapsed ? "mr-0" : "mr-3")} />
          {!isCollapsed && <span>Log Out</span>}
        </Button>
      </div>
    </div>
  )
}