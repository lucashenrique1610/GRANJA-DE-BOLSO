
"use client"

import { memo } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { KnowledgeItem } from "../data"
import { KnowledgeControls } from "./knowledge-controls"

interface KnowledgeCardProps {
  item: KnowledgeItem
  progress: { saved?: boolean; completed?: boolean; readAt?: number }
  isUnread: boolean
  isOpen: boolean
  onToggle: () => void
  onToggleSaved: (id: string) => void
  onToggleCompleted: (id: string) => void
  onMarkRead: (id: string) => void
}

export const KnowledgeCard = memo(function KnowledgeCard({
  item,
  progress,
  isUnread,
  isOpen,
  onToggle,
  onToggleSaved,
  onToggleCompleted,
  onMarkRead,
}: KnowledgeCardProps) {
  return (
    <div
      id={item.id}
      className={cn(
        "group rounded-xl border bg-card transition-all duration-300",
        "hover:shadow-md hover:border-primary/40",
        "min-w-[280px] md:min-w-0 snap-start",
        isOpen ? "ring-1 ring-primary/20 shadow-lg scale-[1.01] z-10" : "opacity-95 hover:opacity-100"
      )}
      role="region"
      onKeyDown={(e) => {
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return
        if (e.key.toLowerCase() === "s") {
            e.preventDefault()
            onToggleSaved(item.id)
        }
        if (e.key.toLowerCase() === "c") {
            e.preventDefault()
            onToggleCompleted(item.id)
        }
      }}
    >
      {/* Interactive Header */}
      <button
        type="button"
        onClick={onToggle}
        onFocus={() => onMarkRead(item.id)}
        className={cn(
            "w-full p-4 flex items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl transition-colors",
            isOpen ? "bg-accent/5" : "hover:bg-accent/5"
        )}
        aria-expanded={isOpen}
        aria-controls={`content-${item.id}`}
      >
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className={cn(
                "text-lg font-bold leading-tight tracking-tight transition-colors",
                isOpen ? "text-primary" : "text-foreground"
            )}>
              {item.title}
            </h3>
            {isUnread && (
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" aria-label="Novo conteúdo" />
            )}
          </div>
          
          {/* Summary visible when collapsed */}
          <p className={cn(
            "text-sm text-muted-foreground transition-all duration-300",
            isOpen ? "h-0 opacity-0 overflow-hidden" : "h-auto opacity-100 line-clamp-2 leading-relaxed"
          )}>
            {item.description}
          </p>
        </div>

        {item.imageSrc && (
          <div className="hidden md:block shrink-0 rounded-md overflow-hidden bg-muted/20 p-1">
            <Image
              src={item.imageSrc}
              alt={item.imageAlt || ""}
              width={48}
              height={48}
              className="object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
        )}

        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground/70 transition-transform duration-300 ease-in-out mt-1",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Collapsible Content Body */}
      <div
        id={`content-${item.id}`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 space-y-5">
            {/* Expanded Description */}
            <p className="text-base leading-[1.7] text-foreground/90 font-normal">
              {item.description}
            </p>

            {/* Main Content */}
            <div className="space-y-5 text-base leading-[1.7] text-foreground/80">
              {item.sections ? (
                item.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    {section.title && (
                        <h4 className="font-semibold text-foreground tracking-tight text-[0.95em]">
                            {section.title}
                        </h4>
                    )}
                    <ul className="list-disc pl-5 space-y-2 marker:text-primary/60">
                      {section.items.map((li, i) => (
                        <li key={i} className="pl-1">{li}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : item.listItems ? (
                <ul className="list-disc pl-5 space-y-2 marker:text-primary/60">
                  {item.listItems.map((li, i) => (
                    <li key={i} className="pl-1">{li}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* Tags/Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {item.badges.map((badge) => (
                <Badge 
                    key={badge} 
                    variant="secondary" 
                    className="px-2.5 py-0.5 text-xs font-medium bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 transition-colors"
                >
                  {badge}
                </Badge>
              ))}
            </div>

            {/* Footer Note */}
            {item.footerText && (
              <div className="relative pl-4 py-1 text-sm italic text-muted-foreground/90">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                {item.footerText}
              </div>
            )}

            <Separator className="opacity-50" />
            
            <KnowledgeControls
              state={progress}
              onToggleSaved={() => onToggleSaved(item.id)}
              onToggleCompleted={() => onToggleCompleted(item.id)}
              unread={false} // Already handled in header
            />
          </div>
        </div>
      </div>
    </div>
  )
})
