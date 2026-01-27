"use client"

import { useEffect, useState } from "react"
import { syncService } from "@/services/sync-service"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { Cloud, CloudOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function SyncIndicator() {
  const isOnline = useNetworkStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [queueLength, setQueueLength] = useState(0)

  useEffect(() => {
    // Subscribe to sync service status
    const unsubscribe = syncService.subscribe((syncing) => {
      setIsSyncing(syncing)
      setQueueLength(syncService.getQueueLength())
    })
    
    // Initial state
    setQueueLength(syncService.getQueueLength())

    return () => unsubscribe()
  }, [])

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
        <CloudOff className="h-3 w-3" />
        <span>Offline</span>
        {queueLength > 0 && <span className="font-mono">({queueLength})</span>}
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Sincronizando...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 opacity-50 hover:opacity-100 transition-opacity">
      <Cloud className="h-3 w-3" />
      <span>Sincronizado</span>
    </div>
  )
}
