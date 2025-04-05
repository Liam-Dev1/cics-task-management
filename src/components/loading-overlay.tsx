"use client"

import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

export function LoadingOverlay({ isVisible, message = "Exporting PDF..." }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md">
        <Loader2 className="h-12 w-12 text-[#8B2332] animate-spin mb-4" />
        <h3 className="text-xl font-semibold mb-2">{message}</h3>
        <p className="text-gray-600 text-center">
          Please wait while we generate your report. This may take a few moments.
        </p>
      </div>
    </div>
  )
}

