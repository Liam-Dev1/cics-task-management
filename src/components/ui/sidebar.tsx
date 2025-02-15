"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Button } from "@/components/ui/button"

interface SidebarContext {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = React.createContext<SidebarContext | undefined>(undefined)

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)

  return <SidebarContext.Provider value={{ collapsed, setCollapsed }}>{children}</SidebarContext.Provider>
}

export function Sidebar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`w-64 h-screen ${className}`}>{children}</div>
}

export function SidebarHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className}>{children}</div>
}

export function SidebarContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 ${className}`}>{children}</div>
}

export function SidebarMenu({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-2 ${className}`}>{children}</div>
}

export function SidebarMenuItem({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className}>{children}</div>
}

export function SidebarMenuButton({
  className,
  asChild,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : Button
  return <Comp variant="ghost" className={`w-full justify-start text-white ${className}`} {...props} />
}

