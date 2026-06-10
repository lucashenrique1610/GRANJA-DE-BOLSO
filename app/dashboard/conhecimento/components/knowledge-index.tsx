
"use client"

import { KnowledgeTab } from "../data"

interface KnowledgeIndexProps {
  currentTabId: string
  tabs: KnowledgeTab[]
}

export function KnowledgeIndex({ currentTabId, tabs }: KnowledgeIndexProps) {
  const currentTab = tabs.find(t => t.id === currentTabId)
  const items = currentTab?.items || []

  if (!currentTab) return null

  return (
    <aside className="hidden md:block sticky top-20 self-start" role="navigation" aria-label="Índice de tópicos">
      <div className="rounded-lg border bg-card p-3 w-[240px]">
        <div className="text-sm font-medium mb-2">Índice</div>
        <div className="space-y-1">
          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className="block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground truncate"
              title={it.title}
            >
              {it.title}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
