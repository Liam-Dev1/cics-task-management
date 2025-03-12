"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, ClipboardList, BarChart3, Users, HelpCircle, User, LogOut, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Tasks", icon: ClipboardList, href: "/task" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Receivers", icon: Users, href: "/receiver" },
  { name: "Help", icon: HelpCircle, href: "/help" },
  { name: "User", icon: User, href: "/user" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [manuallyToggled, setManuallyToggled] = useState(false)

  // Next.js safe window dimension check
  useEffect(() => {
    setMounted(true)
    
    const checkOrientation = () => {
      if (typeof window !== 'undefined' && !manuallyToggled) {
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        setIsMinimized(isPortrait);
        console.log("Orientation check:", isPortrait ? "portrait" : "landscape");
      }
    }
    
    // Initial check after a small delay to ensure DOM is ready
    setTimeout(checkOrientation, 100);
    
    // Use matchMedia for better detection
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const handleOrientationChange = (e) => {
      if (!manuallyToggled) {
        setIsMinimized(e.matches);
        console.log("Orientation changed:", e.matches ? "portrait" : "landscape");
      }
    };
    
    // Modern approach with addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleOrientationChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', checkOrientation);
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleOrientationChange);
      } else {
        window.removeEventListener('resize', checkOrientation);
      }
    };
  }, [manuallyToggled]);

  // Toggle sidebar manually
  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
    setManuallyToggled(true);
  };

  // Consistent initial render for hydration
  if (!mounted) {
    return (
      <div className="w-64 bg-zinc-800 text-white flex flex-col min-h-screen">
        <div className="p-4 mb-8">{/* Placeholder for SSR */}</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-zinc-800 text-white flex flex-col min-h-screen transition-all duration-300 relative",
        isMinimized ? "w-16" : "w-64",
      )}
    >
      {/* Toggle button */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={toggleSidebar}
        className="absolute top-2 right-2 p-1 h-6 w-6 text-white hover:bg-zinc-700"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", isMinimized && "rotate-180")} />
      </Button>

      <div className="p-4 mb-8">
        {!isMinimized && (
          <Image src="/images/CICSTASKMGMT_LOGO.png" alt="CICS Logo" width={150} height={50} className="mb-12" />
        )}

        <nav className="space-y-4">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white hover:bg-zinc-700 text-lg py-3",
                  pathname === item.href && "bg-zinc-700",
                  isMinimized && "px-0 justify-center",
                )}
              >
                <item.icon className={cn("h-6 w-6", !isMinimized && "mr-3")} />
                {!isMinimized && <span>{item.name}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-white hover:bg-zinc-700 text-lg py-3",
            isMinimized ? "px-0 justify-center" : "justify-start",
          )}
        >
          <LogOut className={cn("h-6 w-6", !isMinimized && "mr-3")} />
          {!isMinimized && <span>Log Out</span>}
        </Button>
      </div>
    </div>
  )
}

