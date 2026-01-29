"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { Loader2 } from "lucide-react"

interface LoadingContextType {
  isLoading: boolean
  loadingMessage: string
  startLoading: (message?: string) => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Procesando...")

  const startLoading = (message = "Procesando...") => {
    setLoadingMessage(message)
    setIsLoading(true)
  }

  const stopLoading = () => {
    setIsLoading(false)
  }

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, startLoading, stopLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-background rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{loadingMessage}</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}
