import { useState } from "react"

export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({
    message: "",
    isVisible: false,
  })

  const showToast = (message: string) => {
    setToast({ message, isVisible: true })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }))
  }

  return { toast, showToast, hideToast }
}

