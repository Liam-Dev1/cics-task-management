"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, ClipboardList, HelpCircle, User, LogOut, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Tasks", icon: ClipboardList, href: "/task" },
  { name: "Help", icon: HelpCircle, href: "/help" },
  { name: "User", icon: User, href: "/user" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [manuallyToggled, setManuallyToggled] = useState(false)
  const lastOrientationRef = useRef<boolean | null>(null)

  // Next.js safe window dimension check
  useEffect(() => {
    setMounted(true)

    const checkOrientation = () => {
      if (typeof window !== "undefined") {
        const isPortrait = window.matchMedia("(orientation: portrait)").matches

        // Only log when orientation actually changes
        if (lastOrientationRef.current !== isPortrait) {
          console.log("Orientation check:", isPortrait ? "portrait" : "landscape")
          lastOrientationRef.current = isPortrait

          // If orientation changes, we should reset the manual toggle after a delay
          // This allows automatic adjustments to work again after manual changes
          if (!manuallyToggled) {
            setIsMinimized(isPortrait)
          } else {
            // After 3 seconds of an orientation change, re-enable auto adjustment
            setTimeout(() => {
              setManuallyToggled(false)
              setIsMinimized(isPortrait)
              console.log("Re-enabling automatic sidebar adjustment")
            }, 3000)
          }
        }
      }
    }

    // Initial check
    setTimeout(checkOrientation, 100)

    // Use matchMedia for better detection
    const mediaQuery = window.matchMedia("(orientation: portrait)")
    const handleOrientationChange = (e: MediaQueryListEvent) => {
      console.log("Orientation changed to:", e.matches ? "portrait" : "landscape")
      checkOrientation()
    }

    // Modern approach with addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleOrientationChange)
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", checkOrientation)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleOrientationChange)
      } else {
        window.removeEventListener("resize", checkOrientation)
      }
    }
  }, [manuallyToggled])

  // Toggle sidebar manually
  const toggleSidebar = () => {
    setIsMinimized(!isMinimized)
    setManuallyToggled(true)
    console.log("Sidebar manually toggled, auto-adjustment temporarily disabled")
  }

  // Handle logout button click
  const handleLogout = () => {
    router.push("/logout")
  }

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
        "bg-zinc-800 text-white flex flex-col min-h-screen transition-all duration-300",
        isMinimized ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 mb-8 pb-16">
        {/* Different layouts for minimized vs maximized */}
        {isMinimized ? (
          <>
            {/* Logo centered at the top when minimized */}
            <div className="flex justify-center items-center mb-4">
              <div className="w-full aspect-square relative">
                <Image
                  src="/images/cics_logo.png"
                  alt="CICS Logo"
                  fill
                  className="object-contain transition-none"
                  priority
                />
              </div>
            </div>

            {/* Toggle button below the logo when minimized */}
            <div className="flex justify-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-1 h-8 w-8 text-white hover:bg-zinc-700"
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform rotate-180")} />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Logo and toggle button in a row when maximized */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 relative h-[50px]">
                <Image
                  src="/images/CICSTASKMGMT_LOGO.png"
                  alt="CICS Logo"
                  fill
                  className="object-contain transition-none"
                  priority
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-1 h-8 w-8 text-white hover:bg-zinc-700 ml-4 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </>
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

      <div className="fixed bottom-0 left-0 p-4 bg-zinc-800 w-full">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-white hover:bg-zinc-700 text-lg py-3",
            isMinimized ? "px-0 justify-center" : "justify-start",
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-6 w-6", !isMinimized && "mr-3")} />
          {!isMinimized && <span>Log Out</span>}
        </Button>
      </div>
    </div>
  )
}

