"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  totalPrice: number
  discountPercentage: number
  billingCycle: "monthly" | "quarterly" | "semiannual"
  duration: number // em meses
  features: string[]
}

interface SubscriptionStatus {
  active: boolean
  currentPlan: SubscriptionPlan | null
  startDate: string | null
  endDate: string | null
  paymentStatus: "paid" | "pending" | "failed" | "canceled" | null
  trialEndsAt: string | null
  paymentReference?: string | null
  lastPaymentDate?: string | null
}

export interface PixPaymentResponse {
  id: number
  status: string
  qr_code: string
  qr_code_base64: string
  ticket_url: string
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus
  plans: SubscriptionPlan[]
  isLoading: boolean
  subscribe: (planId: string) => Promise<boolean>
  cancelSubscription: () => Promise<boolean>
  renewSubscription: (planId: string) => Promise<boolean>
  confirmPayment: (reference: string) => Promise<boolean>
  checkAccess: () => boolean
  isInTrial: () => boolean
  daysLeftInTrial: () => number
  daysLeftInSubscription: () => number
  generatePaymentReference: () => string
  subscribeMercadoPagoPix: (planId: string) => Promise<PixPaymentResponse | null>
  subscribeMercadoPagoPreference: (planId: string) => Promise<string | null>
}

// Definição dos planos
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "mensal",
    name: "Mensal",
    price: 20,
    totalPrice: 20,
    discountPercentage: 0,
    billingCycle: "monthly",
    duration: 1,
    features: [
      "Gerenciamento completo de lotes",
      "Controle de vendas e estoque",
      "Formulação de ração personalizada",
      "Controle de saúde dos animais",
      "Relatórios financeiros",
      "Backup e restauração de dados",
      "Suporte técnico",
    ],
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: 20,
    totalPrice: 54, // 3 meses com 10% de desconto
    discountPercentage: 10,
    billingCycle: "quarterly",
    duration: 3,
    features: [
      "Gerenciamento completo de lotes",
      "Controle de vendas e estoque",
      "Formulação de ração personalizada",
      "Controle de saúde dos animais",
      "Relatórios financeiros",
      "Backup e restauração de dados",
      "Suporte técnico",
      "Economia de 10%",
    ],
  },
  {
    id: "semestral",
    name: "Semestral",
    price: 20,
    totalPrice: 96, // 6 meses com 20% de desconto
    discountPercentage: 20,
    billingCycle: "semiannual",
    duration: 6,
    features: [
      "Gerenciamento completo de lotes",
      "Controle de vendas e estoque",
      "Formulação de ração personalizada",
      "Controle de saúde dos animais",
      "Relatórios financeiros",
      "Backup e restauração de dados",
      "Suporte técnico",
      "Economia de 20%",
      "Prioridade no suporte",
    ],
  },
]

const defaultStatus: SubscriptionStatus = {
  active: false,
  currentPlan: null,
  startDate: null,
  endDate: null,
  paymentStatus: null,
  trialEndsAt: null,
  paymentReference: null,
  lastPaymentDate: null,
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(defaultStatus)
  const [plans] = useState<SubscriptionPlan[]>(subscriptionPlans)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    setIsLoading(true)
    try {
      // 1. Tentar carregar do localStorage (rápido)
      const savedData = localStorage.getItem("subscription")
      if (savedData) {
        setSubscriptionStatus(JSON.parse(savedData))
      }

      // 2. Sincronizar com o backend (lento, mas preciso)
      await syncSubscriptionWithBackend()
    } catch (error) {
      console.error("Erro ao carregar dados de assinatura:", error)
      // Se falhar o backend e não tiver local, inicializar trial
      if (!localStorage.getItem("subscription")) {
          initializeTrial()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const initializeTrial = () => {
      const trialDays = 7
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + trialDays)

      const newStatus: SubscriptionStatus = {
          ...defaultStatus,
          trialEndsAt: trialEnd.toISOString(),
      }

      setSubscriptionStatus(newStatus)
      localStorage.setItem("subscription", JSON.stringify(newStatus))
  }

  const syncSubscriptionWithBackend = async () => {
      try {
          const userDataStr = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("currentUser") : null
          if (!userDataStr) return

          const user = JSON.parse(userDataStr)
          const userId = user.id || user.email

          const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`)
          if (res.ok) {
              const data = await res.json()
              if (data.active && data.subscription) {
                  // Atualizar status local com dados do servidor
                  const sub = data.subscription
                  const plan = plans.find(p => p.price === sub.price_id) || plans.find(p => p.id === "mensal") // Fallback
                  
                  // Mapear status do Stripe/Supabase para nosso status
                  const statusMap: Record<string, any> = {
                      'active': 'paid',
                      'trialing': 'paid', // Consideramos trial do Stripe como pago/ativo
                  }

                  const newStatus: SubscriptionStatus = {
                      active: true,
                      currentPlan: plan || null,
                      startDate: sub.current_period_start,
                      endDate: sub.current_period_end,
                      paymentStatus: statusMap[sub.status] || 'pending',
                      lastPaymentDate: sub.created,
                      trialEndsAt: sub.trial_end,
                      paymentReference: sub.id
                  }
                  
                  // Só atualiza se for diferente (para evitar re-renders desnecessários ou loops se eu chamasse em useEffect sem cuidado)
                  // Mas aqui estamos chamando apenas no load.
                  saveSubscriptionData(newStatus)
              }
          }
      } catch (e) {
          console.error("Sync error", e)
      }
  }

  const saveSubscriptionData = (data: SubscriptionStatus) => {
    localStorage.setItem("subscription", JSON.stringify(data))
    setSubscriptionStatus(data)
  }

  // Gerar referência de pagamento
  const generatePaymentReference = (): string => {
    const timestamp = new Date().getTime()
    const random = Math.floor(Math.random() * 10000)
    return `GRANJA${timestamp}${random}`
  }

  const subscribe = async (planId: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      const plan = plans.find((p) => p.id === planId)
      if (!plan) {
        throw new Error("Plano não encontrado")
      }

      // Gerar referência de pagamento
      const paymentReference = generatePaymentReference()

      // Calcular datas de início e fim (mas o status fica como pendente até confirmação)
      const startDate = new Date()
      const endDate = new Date()

      if (plan.billingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (plan.billingCycle === "quarterly") {
        endDate.setMonth(endDate.getMonth() + 3)
      } else {
        endDate.setMonth(endDate.getMonth() + 6)
      }

      const newStatus: SubscriptionStatus = {
        active: false, // Só fica ativo após confirmação do pagamento
        currentPlan: plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentStatus: "pending",
        trialEndsAt: null,
        paymentReference: paymentReference,
        lastPaymentDate: null,
      }

      setSubscriptionStatus(newStatus)
      localStorage.setItem("subscription", JSON.stringify(newStatus))

      return true
    } catch (error) {
      console.error("Erro ao assinar:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }


  const confirmPayment = async (reference: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      // Verificar se a referência corresponde
      if (subscriptionStatus.paymentReference !== reference) {
        toast({
          title: "Referência inválida",
          description: "A referência de pagamento não corresponde à assinatura atual.",
          variant: "destructive",
        })
        return false
      }

      // Atualizar status para pago
      const newStatus: SubscriptionStatus = {
        ...subscriptionStatus,
        active: true,
        paymentStatus: "paid",
        lastPaymentDate: new Date().toISOString(),
      }

      saveSubscriptionData(newStatus)

      toast({
        title: "Pagamento confirmado",
        description: `Sua assinatura está ativa até ${new Date(newStatus.endDate || "").toLocaleDateString("pt-BR")}!`,
      })

      return true
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error)
      toast({
        title: "Erro na confirmação",
        description: "Não foi possível confirmar o pagamento. Tente novamente.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSubscription = async (): Promise<boolean> => {
    // Redirecionar para o Portal do Cliente Stripe
    try {
      const userDataStr = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("currentUser") : null
      if (!userDataStr) throw new Error("Usuário não logado")
      
      const user = JSON.parse(userDataStr)
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        body: JSON.stringify({ userId: user.id || user.email }),
      })
      
      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
        return true
      }
    } catch (e) {
      console.error("Erro ao abrir portal:", e)
    }

    // Fallback local (comportamento antigo)
    try {
      const newStatus: SubscriptionStatus = {
        ...subscriptionStatus,
        active: false,
        paymentStatus: "canceled",
        endDate: new Date().toISOString(),
      }
      setSubscriptionStatus(newStatus)
      localStorage.setItem("subscription", JSON.stringify(newStatus))
      return true
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error)
      return false
    }
  }

  const renewSubscription = async (planId: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      const plan = plans.find((p) => p.id === planId)
      if (!plan) {
        throw new Error("Plano não encontrado")
      }

      // Gerar nova referência de pagamento
      const paymentReference = generatePaymentReference()

      // Calcular novas datas
      const startDate = new Date()
      const endDate = new Date()

      if (plan.billingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (plan.billingCycle === "quarterly") {
        endDate.setMonth(endDate.getMonth() + 3)
      } else {
        endDate.setMonth(endDate.getMonth() + 6)
      }

      const newStatus: SubscriptionStatus = {
        ...subscriptionStatus,
        active: false, // Só fica ativo após confirmação do pagamento
        currentPlan: plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentStatus: "pending",
        paymentReference: paymentReference,
      }

      saveSubscriptionData(newStatus)

      toast({
        title: "Renovação iniciada",
        description: `Aguardando confirmação do pagamento via PIX. Use a referência: ${paymentReference}`,
      })

      return true
    } catch (error) {
      console.error("Erro ao renovar assinatura:", error)
      toast({
        title: "Erro na renovação",
        description: "Não foi possível renovar sua assinatura. Tente novamente.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const checkAccess = (): boolean => {
    // Verificar se o usuário tem acesso ao sistema
    if (subscriptionStatus.active && subscriptionStatus.paymentStatus === "paid") {
      // Verificar se a assinatura ainda está válida
      if (subscriptionStatus.endDate) {
        const endDate = new Date(subscriptionStatus.endDate)
        if (endDate > new Date()) {
          return true
        }
      }
    }

    // Verificar se está no período de teste
    if (isInTrial()) {
      return true
    }

    return false
  }

  const isInTrial = (): boolean => {
    if (!subscriptionStatus.trialEndsAt) return false

    const trialEnd = new Date(subscriptionStatus.trialEndsAt)
    return trialEnd > new Date()
  }

  const daysLeftInTrial = (): number => {
    if (!subscriptionStatus.trialEndsAt) return 0

    const trialEnd = new Date(subscriptionStatus.trialEndsAt)
    const today = new Date()

    const diffTime = trialEnd.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  const daysLeftInSubscription = (): number => {
    if (!subscriptionStatus.endDate) return 0

    const endDate = new Date(subscriptionStatus.endDate)
    const today = new Date()

    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  const subscribeMercadoPagoPix = async (planId: string): Promise<PixPaymentResponse | null> => {
    try {
      setIsLoading(true)
      const plan = plans.find((p) => p.id === planId)
      if (!plan) throw new Error("Plano não encontrado")

      // Tentar obter usuário da sessão (compatível com useAuth)
      let user = { email: "", id: "", nome: "Cliente" }
      try {
        if (typeof localStorage !== "undefined") {
            const sessionStr = localStorage.getItem("granja_session")
            if (sessionStr) {
                const session = JSON.parse(sessionStr)
                if (session.user) {
                    user = {
                        email: session.user.email,
                        id: session.user.id,
                        nome: session.user.user_metadata?.nome || "Cliente"
                    }
                }
            }
        }
      } catch (e) {
        console.warn("Erro ao ler sessão local:", e)
      }

      if (!user.email || !user.id) {
          throw new Error("Usuário não identificado. Faça login novamente.")
      }

      const response = await fetch("/api/mercadopago/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.totalPrice,
          description: `Assinatura Plano ${plan.name}`,
          email: user.email,
          userId: user.id,
          planId: plan.id, // Adicionado planId que faltava
        }),
      })

      if (!response.ok) {
          const errData = await response.text()
          throw new Error(`Falha ao criar pagamento PIX: ${errData}`)
      }

      const data = await response.json()
      
      // Atualizar estado local para pendente
      const startDate = new Date()
      const endDate = new Date()
      if (plan.billingCycle === "monthly") endDate.setMonth(endDate.getMonth() + 1)
      else if (plan.billingCycle === "quarterly") endDate.setMonth(endDate.getMonth() + 3)
      else endDate.setMonth(endDate.getMonth() + 6)

      const newStatus: SubscriptionStatus = {
        ...subscriptionStatus,
        active: false,
        currentPlan: plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentStatus: "pending",
        paymentReference: String(data.id),
      }
      saveSubscriptionData(newStatus)
      
      return data
    } catch (error) {
      console.error("Erro no pagamento PIX:", error)
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível gerar o PIX. Verifique se você está logado.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeMercadoPagoPreference = async (planId: string): Promise<string | null> => {
    try {
      setIsLoading(true)
      const plan = plans.find((p) => p.id === planId)
      if (!plan) throw new Error("Plano não encontrado")

      // Tentar obter usuário da sessão
      let user = { email: "", id: "", nome: "Cliente" }
      try {
        if (typeof localStorage !== "undefined") {
            const sessionStr = localStorage.getItem("granja_session")
            if (sessionStr) {
                const session = JSON.parse(sessionStr)
                if (session.user) {
                    user = {
                        email: session.user.email,
                        id: session.user.id,
                        nome: session.user.user_metadata?.nome || "Cliente"
                    }
                }
            }
        }
      } catch (e) {
          console.warn("Erro ao ler sessão local:", e)
      }

      if (!user.email || !user.id) {
          throw new Error("Usuário não identificado. Faça login novamente.")
      }

      const response = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              title: `Assinatura ${plan.name}`,
              quantity: 1,
              unit_price: plan.totalPrice,
            },
          ],
          payer: {
            email: user.email,
            name: user.nome,
          },
          external_reference: user.id,
          planId: plan.id,
        }),
      })

      if (!response.ok) throw new Error("Falha ao criar preferência")

      const data = await response.json()
      return data.init_point // URL para redirecionamento
    } catch (error) {
      console.error("Erro na preferência:", error)
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível iniciar o pagamento.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        plans,
        isLoading,
        subscribe,
        cancelSubscription,
        renewSubscription,
        confirmPayment,
        checkAccess,
        isInTrial,
        daysLeftInTrial,
        daysLeftInSubscription,
        generatePaymentReference,
        subscribeMercadoPagoPix,
        subscribeMercadoPagoPreference,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}
