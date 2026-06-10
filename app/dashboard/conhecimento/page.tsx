
"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  CloudSun, 
  Tractor, 
  Egg, 
  Bird, 
  ChefHat, 
  Settings, 
  FileText, 
  Droplets,
  BookOpen,
  LucideIcon
} from "lucide-react"
import useLocalStorage from "@/hooks/use-local-storage"
import { KNOWLEDGE_DATA } from "./data"
import { KnowledgeTabContent } from "./components/knowledge-tab-content"
import { KnowledgeIndex } from "./components/knowledge-index"

const ICON_MAP: Record<string, LucideIcon> = {
  CloudSun,
  Tractor,
  Egg,
  Bird,
  ChefHat,
  Settings,
  FileText,
  Droplets,
  BookOpen
}

function ConhecimentoContent() {
  const searchParams = useSearchParams()
  
  const [tab, setTab] = useState<string>(() => {
    const q = searchParams.get("tab")
    return q && KNOWLEDGE_DATA.find(t => t.id === q) ? q : KNOWLEDGE_DATA[0].id
  })

  const [progress, setProgress] = useLocalStorage<Record<string, { saved?: boolean; completed?: boolean; readAt?: number }>>(
    "knowledge-progress",
    {}
  )

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get("tab") !== tab) {
      url.searchParams.set("tab", tab)
      window.history.replaceState({}, "", url.toString())
    }
  }, [tab])

  const toggleSaved = useCallback((id: string) => {
    setProgress((p) => {
        const current = p[id] || {}
        return { ...p, [id]: { ...current, saved: !current.saved } }
    })
  }, [setProgress])

  const toggleCompleted = useCallback((id: string) => {
    setProgress((p) => {
        const current = p[id] || {}
        return { ...p, [id]: { ...current, completed: !current.completed } }
    })
  }, [setProgress])

  const markRead = useCallback((id: string) => {
    setProgress((p) => {
      if (p[id]?.readAt) return p
      return { ...p, [id]: { ...(p[id] || {}), readAt: Date.now() } }
    })
  }, [setProgress])

  const isUnread = useCallback((id: string) => {
    return !progress[id]?.readAt && !progress[id]?.completed
  }, [progress])

  // Memoize the active tab object to avoid searching it on every render
  const activeTabObj = useMemo(() => KNOWLEDGE_DATA.find(t => t.id === tab), [tab])

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
        <p className="text-muted-foreground">
          Guia completo de boas práticas para avicultura caipira e free-range.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Sidebar Index (Desktop) */}
          <KnowledgeIndex currentTabId={tab} tabs={KNOWLEDGE_DATA} />

          <div className="flex-1 min-w-0 w-full space-y-6">
            
            {/* Mobile Navigation (Dropdown) */}
            <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur pt-2 pb-4 -mx-4 px-4 border-b">
               <label className="text-sm font-medium text-muted-foreground mb-2 block">
                 Navegar por tópicos:
               </label>
               <Select value={tab} onValueChange={setTab}>
                 <SelectTrigger className="w-full h-12 bg-card">
                   <div className="flex items-center gap-3">
                     {(() => {
                        const Icon = activeTabObj ? (ICON_MAP[activeTabObj.iconName] || BookOpen) : BookOpen
                        return <Icon className="h-5 w-5 text-primary" />
                     })()}
                     <span className="font-medium text-base truncate">
                       {activeTabObj?.label || "Selecione um tópico"}
                     </span>
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   {KNOWLEDGE_DATA.map((t) => {
                      const Icon = ICON_MAP[t.iconName] || BookOpen
                      return (
                        <SelectItem key={t.id} value={t.id} className="py-3">
                           <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{t.label}</span>
                           </div>
                        </SelectItem>
                      )
                   })}
                 </SelectContent>
               </Select>
            </div>

            {/* Desktop Navigation (Wrapped Tabs) */}
            <div className="hidden md:block sticky top-0 z-20 bg-background/95 backdrop-blur py-4 border-b mb-6">
                <TabsList className="w-full flex flex-wrap h-auto justify-start gap-3 bg-transparent p-0">
                {KNOWLEDGE_DATA.map((t) => {
                    const Icon = ICON_MAP[t.iconName] || BookOpen
                    return (
                    <TabsTrigger
                        key={t.id}
                        value={t.id}
                        className="
                          flex items-center gap-2 px-4 py-2.5 h-auto rounded-full border bg-card
                          data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary
                          data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-accent-foreground
                          transition-all duration-200
                        "
                    >
                        <Icon className="h-4 w-4" />
                        <span>{t.label}</span>
                    </TabsTrigger>
                    )
                })}
                </TabsList>
            </div>

            <div className="min-h-[500px]">
                {KNOWLEDGE_DATA.map((t) => (
                    <KnowledgeTabContent
                        key={t.id}
                        tab={t}
                        Icon={ICON_MAP[t.iconName] || BookOpen}
                        progress={progress}
                        isUnread={isUnread}
                        onToggleSaved={toggleSaved}
                        onToggleCompleted={toggleCompleted}
                        onMarkRead={markRead}
                    />
                ))}
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

export default function ConhecimentoPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 md:p-6 space-y-6">Carregando...</div>}>
      <ConhecimentoContent />
    </Suspense>
  )
}
