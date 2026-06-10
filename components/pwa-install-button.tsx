"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Share } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { usePwa } from "@/contexts/pwa-context"

export function PwaInstallButton() {
  const { deferredPrompt, isIOS, isStandalone, install } = usePwa()
  const [mounted, setMounted] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isStandalone) return null
  
  // Show if we have a prompt (Android/Desktop) or if it's iOS
  // IMPORTANT: For debugging/testing, we might want to show it even if deferredPrompt is null, 
  // but disabled? No, user said "option doesn't appear".
  
  if (!deferredPrompt && !isIOS) {
    // Optional: Log why it's hidden for debugging
    // console.log("PWA Button hidden: No prompt and not iOS")
    return null
  }

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSHelp(true)
    } else {
      install()
    }
  }

  if (isIOS) {
    return (
      <Dialog open={showIOSHelp} onOpenChange={setShowIOSHelp}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5">
            <Download className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Instalar App</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar no iPhone/iPad</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para instalar o aplicativo:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
              <p>Toque no botão <span className="font-semibold">Compartilhar</span> <Share className="h-4 w-4 inline" /></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
              <p>Role para baixo e selecione <span className="font-semibold">Adicionar à Tela de Início</span></p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleInstallClick}
      className="gap-2 border-primary/20 hover:bg-primary/5"
    >
      <Download className="h-4 w-4 text-primary" />
      <span className="hidden sm:inline">Instalar App</span>
    </Button>
  )
}
