"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DataService, type TipFeedback, type TipPreferences } from "@/services/data-service"
import { useToast } from "@/components/ui/use-toast"

type TipRule = {
  id: string
  paths: string[]
  title: string
  short: string
  detailsRoute?: string
  relatedRoute?: string
}

type TipsContextValue = {
  recordAction: (action: string, meta?: Record<string, string | number>) => void
}

const TipsContext = createContext<TipsContextValue | undefined>(undefined)

const TIP_DELAY_MS = 3000
const TIP_COOLDOWN_MS = 12 * 60 * 60 * 1000

const rules: TipRule[] = [
  {
    id: "compras-racao",
    paths: ["/dashboard/compras"],
    title: "Registre compras de ração e cama",
    short: "Manter compras atualizadas ajuda no controle de custos e estoque.",
    detailsRoute: "/dashboard/conhecimento?tab=misturas-racao",
    relatedRoute: "/dashboard/formulacao",
  },
  {
    id: "fornecedores-cadastro",
    paths: ["/dashboard/fornecedores"],
    title: "Mantenha o cadastro de fornecedores",
    short: "Dados completos facilitam negociações e reposição rápida.",
    detailsRoute: "/dashboard/conhecimento?tab=documentacao",
  },
  {
    id: "clientes-cadastro",
    paths: ["/dashboard/clientes"],
    title: "Atualize dados dos clientes",
    short: "Contato e CPF/CNPJ corretos agilizam vendas e faturamento.",
    detailsRoute: "/dashboard/conhecimento?tab=venda-ovos",
  },
  {
    id: "formulacao-proteina",
    paths: ["/dashboard/formulacao"],
    title: "Ajuste proteína conforme fase das aves",
    short: "Evita desperdício e melhora desempenho na postura.",
    detailsRoute: "/dashboard/conhecimento?tab=misturas-racao",
  },
  {
    id: "clima-ideal",
    paths: ["/dashboard/clima"],
    title: "Monitore clima para conforto térmico",
    short: "Ventilação e sombra reduzem estresse e mortalidade.",
    detailsRoute: "/dashboard/conhecimento?tab=clima-ideal",
  },
  {
    id: "dashboard-conhecimento",
    paths: ["/dashboard"],
    title: "Explore o banco de conhecimento",
    short: "Dicas práticas sobre manejo, saúde, alimentação e vendas.",
    detailsRoute: "/dashboard/conhecimento?tab=manejo",
  },
]

export function TipsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [prefs, setPrefs] = useState<TipPreferences>(() => DataService.getTipPreferences())
  const lastPathRef = useRef<string>("")

  useEffect(() => {
    lastPathRef.current = pathname || ""
    try {
      const historyRaw = localStorage.getItem("usageHistory")
      const history = historyRaw ? JSON.parse(historyRaw) : []
      const next = [...history, { path: pathname, ts: Date.now() }].slice(-50)
      localStorage.setItem("usageHistory", JSON.stringify(next))
    } catch {}
  }, [pathname])

  useEffect(() => {
    const timer = setTimeout(() => {
      const path = pathname || ""
      const match = rules.find((r) => r.paths.some((p) => path.startsWith(p)))
      if (!match) return

      const now = Date.now()
      const last = prefs.lastShown[match.id] || 0
      const dismissed = prefs.dismissed.includes(match.id)
      const irrelevant = prefs.irrelevant.includes(match.id)
      if (irrelevant) return
      if (dismissed) return
      if (now - last < TIP_COOLDOWN_MS) return

      DataService.setTipLastShown(match.id, now)
      setPrefs(DataService.getTipPreferences())

      const onView = () => {
        const fb: TipFeedback = { id: match.id, action: "view", ts: Date.now(), path }
        DataService.saveTipFeedback(fb)
        router.push(match.detailsRoute || "/dashboard/conhecimento")
      }
      const onIgnore = () => {
        DataService.dismissTipTemporarily(match.id)
        const fb: TipFeedback = { id: match.id, action: "ignore", ts: Date.now(), path }
        DataService.saveTipFeedback(fb)
        setPrefs(DataService.getTipPreferences())
      }
      const onIrrelevant = () => {
        DataService.markTipIrrelevant(match.id)
        const fb: TipFeedback = { id: match.id, action: "irrelevant", ts: Date.now(), path }
        DataService.saveTipFeedback(fb)
        setPrefs(DataService.getTipPreferences())
      }
      const onRelated = () => {
        const fb: TipFeedback = { id: match.id, action: "related", ts: Date.now(), path }
        DataService.saveTipFeedback(fb)
        if (match.relatedRoute) router.push(match.relatedRoute)
      }

      toast({
        title: match.title,
        description: (
          <div className="space-y-2">
            <div>{match.short}</div>
            <div className="flex flex-wrap gap-3">
              <button className="underline text-primary" onClick={onView}>Ver detalhes</button>
              <button className="underline text-muted-foreground" onClick={onIgnore}>Ignorar</button>
              <button className="underline text-destructive" onClick={onIrrelevant}>Irrelevante</button>
              {match.relatedRoute && (
                <button className="underline" onClick={onRelated}>Relacionado</button>
              )}
            </div>
          </div>
        ),
      })
    }, TIP_DELAY_MS)

    return () => clearTimeout(timer)
  }, [pathname, prefs, router, toast])

  const value = useMemo<TipsContextValue>(() => ({
    recordAction: (action: string, meta?: Record<string, string | number>) => {
      try {
        const raw = localStorage.getItem("usageActions")
        const arr: Array<{ action: string; ts: number; path: string } & Record<string, string | number>> = raw ? JSON.parse(raw) : []
        arr.push({ action, ts: Date.now(), path: lastPathRef.current, ...(meta || {}) })
        localStorage.setItem("usageActions", JSON.stringify(arr.slice(-200)))
      } catch {}
    },
  }), [])

  return <TipsContext.Provider value={value}>{children}</TipsContext.Provider>
}

export function useTips() {
  const ctx = useContext(TipsContext)
  if (!ctx) throw new Error("useTips must be used within a TipsProvider")
  return ctx
}
