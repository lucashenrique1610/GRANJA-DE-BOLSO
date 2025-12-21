"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/contexts/subscription-context"

interface SubscriptionCheckProps {
  children: React.ReactNode
}

export function SubscriptionCheck({ children }: SubscriptionCheckProps) {
  const router = useRouter()
  const { checkAccess, isLoading } = useSubscription()

  useEffect(() => {
    // Verificar acesso apenas após o carregamento dos dados de assinatura
    if (!isLoading && !checkAccess()) {
      router.push("/assinatura")
    }
  }, [checkAccess, isLoading, router])

  // Enquanto estiver carregando, não renderiza nada
  if (isLoading) {
    return null
  }

  // Se tiver acesso, renderiza os filhos
  if (checkAccess()) {
    return <>{children}</>
  }

  // Se não tiver acesso, não renderiza nada (será redirecionado)
  return null
}
