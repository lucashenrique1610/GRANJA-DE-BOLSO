"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Share, PlusSquare } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PwaInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)

    // Check dismissal state
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    const lastShown = localStorage.getItem("pwa-prompt-last-shown")
    const now = Date.now()
    const shouldShow = !dismissed || (lastShown && now - parseInt(lastShown) > 7 * 24 * 60 * 60 * 1000)

    if (isIOSDevice && shouldShow && !window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(true)
      localStorage.setItem("pwa-prompt-last-shown", now.toString())
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      if (shouldShow) {
        setShowPrompt(true)
        localStorage.setItem("pwa-prompt-last-shown", now.toString())
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  if (isStandalone) return null
  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-2 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 h-6 w-6" 
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg flex items-center gap-2">
            {isIOS ? (
              <Share className="h-5 w-5 text-primary" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            Instalar Aplicativo
          </CardTitle>
          <CardDescription>
            {isIOS 
              ? "Instale o Granja Bolso no seu iPhone para acesso rápido." 
              : "Instale o Granja Bolso para acesso rápido e funcionamento offline."
            }
          </CardDescription>
        </CardHeader>
        
        {isIOS ? (
          <CardContent className="pt-2 pb-2 text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              1. Toque no botão <Share className="h-4 w-4 inline" /> Compartilhar
            </div>
            <div className="flex items-center gap-2">
              2. Selecione <PlusSquare className="h-4 w-4 inline" /> Adicionar à Tela de Início
            </div>
          </CardContent>
        ) : (
          <CardFooter className="pt-2">
            <Button onClick={handleInstallClick} className="w-full">
              Adicionar à Tela Inicial
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
