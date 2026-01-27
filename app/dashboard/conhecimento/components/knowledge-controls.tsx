
"use client"

import { Badge } from "@/components/ui/badge"
import { Bookmark, Check } from "lucide-react"

interface KnowledgeControlsProps {
  state: { saved?: boolean; completed?: boolean; readAt?: number }
  onToggleSaved: () => void
  onToggleCompleted: () => void
  unread: boolean
}

export function KnowledgeControls({
  state,
  onToggleSaved,
  onToggleCompleted,
  unread,
}: KnowledgeControlsProps) {
  const pct = state.completed ? 100 : state.readAt ? 50 : 0
  
  return (
    <div className="mt-4 space-y-3">
      <div className="h-1.5 w-full rounded bg-muted">
        <div
          className="h-1.5 rounded bg-primary transition-all"
          style={{ width: `${pct}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          role="progressbar"
        />
      </div>
      <div className="flex items-center gap-2">
        {unread ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            Novo
          </span>
        ) : state.completed ? (
          <Badge variant="outline">Concluído</Badge>
        ) : (
          <Badge variant="secondary">Em andamento</Badge>
        )}
        <div className="ml-auto flex gap-1">
             <button
                type="button"
                onClick={onToggleSaved}
                className={`inline-flex items-center justify-center rounded-md border p-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  state.saved ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent hover:text-accent-foreground"
                }`}
                title={state.saved ? "Remover dos salvos" : "Salvar para depois"}
                aria-label={state.saved ? "Remover dos salvos" : "Salvar para depois"}
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onToggleCompleted}
                className={`inline-flex items-center justify-center rounded-md border p-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  state.completed ? "bg-green-600 text-white border-green-600" : "hover:bg-accent hover:text-accent-foreground"
                }`}
                title={state.completed ? "Marcar como não concluído" : "Marcar como concluído"}
                aria-label={state.completed ? "Marcar como não concluído" : "Marcar como concluído"}
              >
                <Check className="h-4 w-4" />
              </button>
        </div>
      </div>
    </div>
  )
}
