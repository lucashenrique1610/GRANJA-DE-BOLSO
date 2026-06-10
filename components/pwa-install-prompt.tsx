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
import { usePwa } from "@/contexts/pwa-context"

export function PwaInstallPrompt() {
  const { deferredPrompt, isIOS, isStandalone, install } = usePwa()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check dismissal state
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    const lastShown = localStorage.getItem("pwa-prompt-last-shown")
    const now = Date.now()
    const shouldShow = !dismissed || (lastShown && now - parseInt(lastShown) > 7 * 24 * 60 * 60 * 1000)

    // Show prompt if available or if iOS (and not standalone)
    if (shouldShow && !isStandalone) {
      if (deferredPrompt || isIOS) {
         setShowPrompt(true)
         localStorage.setItem("pwa-prompt-last-shown", now.toString())
      }
    }
  }, [deferredPrompt, isIOS, isStandalone])

  const handleInstallClick = async () => {
    if (isIOS) {
        // iOS doesn't support programmatic install, so we just keep the prompt open 
        // which contains instructions. But here the button is "Instalar".
        // Actually the iOS UI below shows instructions directly.
    } else {
        await install()
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
        <CardContent>
          {isIOS ? (
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                1. Toque no botão <Share className="h-4 w-4" />
              </p>
              <p className="flex items-center gap-2">
                2. Selecione <span className="font-semibold">Adicionar à Tela de Início</span> <PlusSquare className="h-4 w-4" />
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tenha acesso direto da sua tela inicial, sem precisar abrir o navegador.
            </p>
          )}
        </CardContent>
        {!isIOS && (
            <CardFooter>
              <Button className="w-full gap-2" onClick={handleInstallClick}>
                <Download className="h-4 w-4" />
                Instalar Agora
              </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  )
}
