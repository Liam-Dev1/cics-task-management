"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/frassatibg.jpeg" alt="Building exterior" fill className="object-cover w-full h-full" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl px-4 flex items-center justify-center">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-12 lg:gap-16 text-white">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-6 whitespace-nowrap md:self-end md:mb-[52px]">
            <div className="w-24 h-24 md:w-24 md:h-24 relative flex-shrink-0">
              <Image
                src="/images/cics logo.png"
                alt="CICS Logo"
                width={96}
                height={96}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex items-center gap-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight flex-shrink-0">CICS</h1>
              <div className="text-lg md:text-3xl text-white/90">
                <div className="whitespace-nowrap">Personnel Task Monitoring</div>
                <div className="whitespace-nowrap">And Management System</div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full md:w-[350px] lg:w-[450px] space-y-4">
            <Input type="email" placeholder="Email" className="h-12 bg-white text-black text-lg" />
            <Input type="password" placeholder="Password" className="h-12 bg-white text-black text-lg" />
            <Button className="w-full h-12 text-lg font-medium bg-[#8B3A3A] hover:bg-[#722F2F] text-white">
              Log in
            </Button>
            <div className="text-center">
              <Link href="#" className="text-white hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

