"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check, AlertTriangle, Calendar, Clock, QrCode, Copy, CreditCard } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/format-utils"
import { useToast } from "@/components/ui/use-toast"

export default function AssinaturaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { requireAuth } = useAuth()
  const {
    subscriptionStatus,
    plans,
    isLoading,
    cancelSubscription,
    // renewSubscription,
    confirmPayment,
    isInTrial,
    daysLeftInTrial,
    daysLeftInSubscription,
    subscribeMercadoPagoPix,
    subscribeMercadoPagoPreference,
    checkPaymentStatus,
  } = useSubscription()

  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("mensal")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix")

  // Polling para verificar status do pagamento PIX
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (subscriptionStatus.paymentStatus === "pending") {
      interval = setInterval(async () => {
        await checkPaymentStatus()
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [subscriptionStatus.paymentStatus, checkPaymentStatus])

  // Verificar autenticação
  requireAuth()

  const handleSubscribe = async () => {
    setIsProcessing(true)
    try {
      if (paymentMethod === "pix") {
        const pixData = await subscribeMercadoPagoPix(selectedPlan)
        if (pixData) {
          sessionStorage.setItem("lastPixPayment", JSON.stringify(pixData))
          router.push("/assinatura/pagamento")
        }
      } else {
        const url = await subscribeMercadoPagoPreference(selectedPlan)
        if (url) {
          window.location.href = url
        }
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível processar o pagamento.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

/*
  const handleRenew = async () => {
    setIsProcessing(true)
    const success = await renewSubscription(selectedPlan)
    setIsProcessing(false)

    if (success) {
      // Redirecionar para a página de pagamento
      router.push("/assinatura/pagamento")
    }
  }
*/

  const handleCancel = async () => {
    if (confirm("Tem certeza que deseja cancelar sua assinatura?")) {
      setIsProcessing(true)
      await cancelSubscription()
      setIsProcessing(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!paymentReference) {
      toast({
        title: "Referência necessária",
        description: "Por favor, insira a referência do pagamento.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    const success = await confirmPayment(paymentReference)
    setIsProcessing(false)

    if (success) {
      router.push("/dashboard")
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Referência copiada para a área de transferência.",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando informações da assinatura...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Assinatura Granja de Bolso</h1>
          <p className="text-muted-foreground">Gerencie sua granja de forma simples e eficiente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Planos de assinatura */}
          {plans.map((plan) => (
            <Card key={plan.id} className={`shadow-lg ${selectedPlan === plan.id ? "ring-2 ring-primary" : ""}`}>
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.discountPercentage > 0 && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      {plan.discountPercentage}% OFF
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {plan.billingCycle === "monthly"
                    ? "Pagamento mensal"
                    : plan.billingCycle === "quarterly"
                      ? "Pagamento trimestral"
                      : "Pagamento semestral"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <p className="text-3xl font-bold">
                    {formatCurrency(plan.totalPrice)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /
                      {plan.billingCycle === "monthly"
                        ? "mês"
                        : plan.billingCycle === "quarterly"
                          ? "3 meses"
                          : "6 meses"}
                    </span>
                  </p>
                  {plan.discountPercentage > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Equivalente a {formatCurrency(plan.totalPrice / plan.duration)}/mês
                    </p>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  className="w-full"
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {selectedPlan === plan.id ? "Selecionado" : "Selecionar"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status da assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="font-medium">
                    {isInTrial() ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Período de teste
                      </Badge>
                    ) : subscriptionStatus.active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativa
                      </Badge>
                    ) : subscriptionStatus.paymentStatus === "pending" ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Pagamento pendente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Inativa
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium">{subscriptionStatus.currentPlan?.name || "Nenhum"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="font-medium">{formatDate(subscriptionStatus.startDate)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Término</p>
                  <p className="font-medium">{formatDate(subscriptionStatus.endDate)}</p>
                </div>
              </div>

              {isInTrial() && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Calendar className="h-4 w-4 text-blue-700" />
                  <AlertDescription className="text-blue-700">
                    Você está no período de teste. Restam {daysLeftInTrial()} dias.
                  </AlertDescription>
                </Alert>
              )}

              {subscriptionStatus.active && (
                <Alert className="bg-green-50 border-green-200">
                  <Calendar className="h-4 w-4 text-green-700" />
                  <AlertDescription className="text-green-700">
                    Sua assinatura está ativa por mais {daysLeftInSubscription()} dias.
                  </AlertDescription>
                </Alert>
              )}

              {subscriptionStatus.paymentStatus === "pending" && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Seu pagamento está pendente. Por favor, realize o pagamento via PIX e confirme abaixo.
                  </AlertDescription>
                </Alert>
              )}

              {!isInTrial() && !subscriptionStatus.active && subscriptionStatus.paymentStatus !== "pending" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Sua assinatura está inativa. Renove para continuar usando o sistema.
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirmação de pagamento */}
              {subscriptionStatus.paymentStatus === "pending" && (
                <div className="space-y-4 mt-4 p-4 border rounded-md bg-amber-50/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Aguardando Pagamento</h3>
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full animate-pulse">
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></div>
                      Verificando automaticamente...
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-sm">Referência do pagamento:</p>
                    <Badge variant="outline" className="font-mono">
                      {subscriptionStatus.paymentReference}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(subscriptionStatus.paymentReference || "")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Após realizar o pagamento via PIX, insira a referência acima para confirmar.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite a referência do pagamento"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                    <Button onClick={handleConfirmPayment} disabled={isProcessing}>
                      {isProcessing ? "Processando..." : "Confirmar"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionStatus.lastPaymentDate ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">
                        {subscriptionStatus.currentPlan?.name || "Assinatura"} -{" "}
                        {subscriptionStatus.currentPlan?.billingCycle === "monthly"
                          ? "Mensal"
                          : subscriptionStatus.currentPlan?.billingCycle === "quarterly"
                            ? "Trimestral"
                            : "Semestral"}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDate(subscriptionStatus.lastPaymentDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(subscriptionStatus.currentPlan?.totalPrice || 0)}</p>
                      <Badge
                        variant={subscriptionStatus.paymentStatus === "paid" ? "outline" : "destructive"}
                        className={`text-xs ${
                          subscriptionStatus.paymentStatus === "paid"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : ""
                        }`}
                      >
                        {subscriptionStatus.paymentStatus === "paid" ? "Pago" : "Cancelado"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum pagamento registrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4 flex-col items-center">
          {isInTrial() || (!subscriptionStatus.active && subscriptionStatus.paymentStatus !== "pending") ? (
            <div className="w-full max-w-md space-y-4">
               <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4">Escolha o método de pagamento</h3>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "pix" | "card")}>
                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer w-full">
                        <QrCode className="h-5 w-5 text-green-600" />
                        <div>
                          <span className="font-medium">PIX (Instantâneo)</span>
                          <p className="text-xs text-muted-foreground">Liberação imediata via QR Code</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer w-full">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <span className="font-medium">Cartão de Crédito / Boleto</span>
                          <p className="text-xs text-muted-foreground">Via Mercado Pago (Até 12x)</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
               </Card>

              <Button className="w-full" onClick={handleSubscribe} disabled={isProcessing}>
                {isProcessing ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    {paymentMethod === "pix" ? <QrCode className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    {paymentMethod === "pix" ? "Gerar PIX" : "Ir para Pagamento"}
                  </span>
                )}
              </Button>
            </div>
          ) : subscriptionStatus.active ? (
            <Button variant="outline" className="w-full md:w-auto" onClick={handleCancel} disabled={isProcessing}>
              Cancelar assinatura
            </Button>
          ) : null}

          <Button variant="outline" className="w-full md:w-auto" onClick={() => router.push("/dashboard")}>
            Voltar para o Dashboard
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>Para suporte ou dúvidas sobre sua assinatura, entre em contato pelo email: granjapitusca@gmail.com</p>
        </div>
      </div>
    </div>
  )
}
