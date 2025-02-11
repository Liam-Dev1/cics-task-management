'use client'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/frassatibg.jpeg"
          alt="Building exterior"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex flex-col items-center gap-6 text-white">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 w-full">
            <div className="w-16 h-16 relative">
              <Image src="/placeholder.svg" alt="CICS Logo" width={64} height={64} className="object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">CICS</h1>
              <p className="text-lg text-white/90">
                Personnel Task Monitoring
                <br />
                And Management System
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full space-y-4 mt-4">
            <Input type="email" placeholder="Email" className="h-12 bg-white text-black" />
            <Input type="password" placeholder="Password" className="h-12 bg-white text-black" />
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