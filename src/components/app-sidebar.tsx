"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, BarChart3, Users, HelpCircle, User2, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar"

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Tasks", icon: CheckSquare, path: "/tasks" },
  { name: "Reports", icon: BarChart3, path: "/reports" },
  { name: "Receivers", icon: Users, path: "/receivers" },
  { name: "Help", icon: HelpCircle, path: "/help" },
  { name: "User", icon: User2, path: "/user" },
  { name: "Log Out", icon: LogOut, path: "/logout" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar className="bg-zinc-800 text-white border-r-0">
        <SidebarHeader className="p-4 border-b border-zinc-700">
          <Image
            src="/images/CICSTASKMGMT_logo.png"
            alt="CICS Logo"
            width={150}
            height={40}
            className="w-auto h-8"
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  className={`w-full justify-start ${
                    pathname === item.path ? "bg-zinc-700 hover:bg-zinc-700" : "hover:bg-zinc-700/50"
                  }`}
                >
                  <button>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

