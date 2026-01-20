"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface PwaContextType {
  deferredPrompt: any
  isIOS: boolean
  isStandalone: boolean
  install: () => Promise<void>
}

const PwaContext = createContext<PwaContextType>({
  deferredPrompt: null,
  isIOS: false,
  isStandalone: false,
  install: async () => {},
})

export function usePwa() {
  return useContext(PwaContext)
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Detect Standalone
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      setIsStandalone(isStandaloneMode)
    }
    
    checkStandalone()
    window.matchMedia("(display-mode: standalone)").addEventListener("change", checkStandalone)

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      console.log("PWA: beforeinstallprompt captured")
      setDeferredPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check if already installed (optional fallback)
    if (window.matchMedia("(display-mode: standalone)").matches) {
        setDeferredPrompt(null)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.matchMedia("(display-mode: standalone)").removeEventListener("change", checkStandalone)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA: User response to install prompt: ${outcome}`)
    
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  return (
    <PwaContext.Provider value={{ deferredPrompt, isIOS, isStandalone, install }}>
      {children}
    </PwaContext.Provider>
  )
}
