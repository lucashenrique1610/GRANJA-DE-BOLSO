"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { QrCode, Copy, ArrowLeft, Check, Clock } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/format-utils"
import { useToast } from "@/components/ui/use-toast"

export default function PagamentoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, requireAuth } = useAuth()
  const { subscriptionStatus, isLoading, confirmPayment } = useSubscription()
  const [countdown, setCountdown] = useState(900) // 15 minutos em segundos
  const [isConfirming, setIsConfirming] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [pollingStatus, setPollingStatus] = useState<string>("")

  const displayBase64 = pixData?.qr_code_base64 || ""
  const displayCopyPaste = pixData?.qr_code || ""
  const displayValue = pixData?.transaction_amount || subscriptionStatus.currentPlan?.totalPrice || 0
  const displayId = pixData?.id || subscriptionStatus.paymentReference || ""

  // Verificar autenticação
  requireAuth()

  useEffect(() => {
    const saved = sessionStorage.getItem("lastPixPayment")
    if (saved) {
      setPixData(JSON.parse(saved))
    } else if (!isLoading && subscriptionStatus.paymentStatus !== "pending") {
       router.push("/assinatura")
    }
  }, [isLoading, subscriptionStatus, router])

  // Polling de status do pagamento
  useEffect(() => {
    if (!displayId || isConfirming) return

    const pollInterval = setInterval(async () => {
      try {
        // Verificar status silenciosamente
        const res = await fetch("/api/mercadopago/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: displayId }),
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.confirmed) {
            clearInterval(pollInterval)
            toast({ title: "Pagamento confirmado!", description: "Sua assinatura foi ativada com sucesso." })
            // Atualizar estado global
            await confirmPayment(displayId.toString())
            router.push("/dashboard")
          } else {
             setPollingStatus(data.status)
          }
        }
      } catch (e) {
        console.error("Erro no polling de pagamento", e)
      }
    }, 5000) // Verificar a cada 5 segundos

    return () => clearInterval(pollInterval)
  }, [displayId, isConfirming, router, confirmPayment, toast])

  useEffect(() => {
    // Iniciar contagem regressiva
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Informação copiada para a área de transferência.",
    })
  }

  const handleConfirmPayment = async () => {
    if (!subscriptionStatus.paymentReference) return

    setIsConfirming(true)
    const success = await confirmPayment(subscriptionStatus.paymentReference)
    setIsConfirming(false)

    if (success) {
      router.push("/dashboard")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando informações de pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto space-y-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Pagamento via PIX</h1>
          <p className="text-muted-foreground">Complete seu pagamento para ativar sua assinatura</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Detalhes do Pagamento</CardTitle>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{formatTime(countdown)}</span>
                </div>
                {pollingStatus === "pending" && (
                   <span className="text-xs font-medium text-blue-600 animate-pulse mt-1">Aguardando confirmação...</span>
                )}
                {pollingStatus && pollingStatus !== "pending" && (
                   <span className="text-xs font-medium text-muted-foreground capitalize mt-1">Status: {pollingStatus}</span>
                )}
              </div>
            </div>
            <CardDescription>
              Plano {subscriptionStatus.currentPlan?.name} - {formatCurrency(displayValue)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
                {displayBase64 ? (
                   <img 
                    src={`data:image/png;base64,${displayBase64}`} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 object-contain"
                   />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-md">
                    <QrCode className="h-24 w-24 text-gray-400" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Escaneie com seu banco</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Código Copia e Cola</p>
                <div className="flex items-center gap-2">
                  <Input 
                    readOnly 
                    value={displayCopyPaste} 
                    className="bg-gray-50 font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(displayCopyPaste)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Valor</p>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-md text-sm flex-1">{formatCurrency(displayValue)}</div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(displayValue.toString())}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">ID do Pagamento</p>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-md text-sm flex-1 font-mono">{displayId}</div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(displayId.toString())}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-700">
                <p className="font-medium">Instruções:</p>
                <ol className="list-decimal pl-4 mt-1 space-y-1 text-sm">
                  <li>Abra o aplicativo do seu banco</li>
                  <li>Escolha a opção de pagamento via PIX</li>
                  <li>Escaneie o QR Code ou use o "Copia e Cola"</li>
                  <li>Confirme o valor de {formatCurrency(displayValue)}</li>
                  <li>
                    O pagamento será confirmado automaticamente em alguns instantes.
                  </li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" onClick={handleConfirmPayment} disabled={isConfirming}>
              {isConfirming ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Confirmando...
                </span>
              ) : (
                <span className="flex items-center">
                  <Check className="mr-2 h-4 w-4" />
                  Já realizei o pagamento
                </span>
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/assinatura")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Após o pagamento, pode levar alguns minutos para a confirmação. Se tiver problemas, entre em contato pelo
            email: granjapitusca@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}
