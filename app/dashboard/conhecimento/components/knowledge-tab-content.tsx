
"use client"

import { useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { KnowledgeTab } from "../data"
import { KnowledgeCard } from "./knowledge-card"
import { LucideIcon } from "lucide-react"

interface KnowledgeTabContentProps {
  tab: KnowledgeTab
  Icon: LucideIcon
  progress: Record<string, { saved?: boolean; completed?: boolean; readAt?: number }>
  isUnread: (id: string) => boolean
  onToggleSaved: (id: string) => void
  onToggleCompleted: (id: string) => void
  onMarkRead: (id: string) => void
}

export function KnowledgeTabContent({
  tab,
  Icon,
  progress,
  isUnread,
  onToggleSaved,
  onToggleCompleted,
  onMarkRead,
}: KnowledgeTabContentProps) {
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    setOpenCardId((prev) => (prev === id ? null : id))
  }

  return (
    <TabsContent value={tab.id}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">{tab.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div
            className="
              md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
              flex md:block gap-4 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0 snap-x md:snap-none items-start
            "
            role="region"
            aria-label="Conteúdo da categoria"
          >
            {tab.items.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                progress={progress[item.id] || {}}
                isUnread={isUnread(item.id)}
                isOpen={openCardId === item.id}
                onToggle={() => handleToggle(item.id)}
                onToggleSaved={onToggleSaved}
                onToggleCompleted={onToggleCompleted}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <a href="#top" className="text-sm underline">
              Voltar ao topo
            </a>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
