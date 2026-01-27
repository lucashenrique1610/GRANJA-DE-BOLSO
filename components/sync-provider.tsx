"use client"

import { useEffect } from "react"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { syncService } from "@/services/sync-service"

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useNetworkStatus()

  useEffect(() => {
    if (isOnline) {
      // When coming online, try to sync
      console.log("Network is online. Triggering sync...")
      syncService.processQueue()
      syncService.pullUpdates()
    }
  }, [isOnline])

  // Also set up an interval to sync periodically if online
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncService.pullUpdates()
        syncService.processQueue()
      }
    }, 60000 * 5) // Sync every 5 minutes

    return () => clearInterval(interval)
  }, [])

  return <>{children}</>
}
