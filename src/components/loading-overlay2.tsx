"use client"

import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

export function LoadingOverlay2({ isVisible }: { isVisible: boolean }) {
    if (!isVisible) return null
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B2332] mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-gray-800">Reports Loading...</p>
        </div>
      </div>
    )
  }

