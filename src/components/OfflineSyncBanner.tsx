"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react"
import { getOfflineQueue, flushOfflineQueue, isOnline, OfflineAction } from "@/lib/offlineSync"

export function OfflineSyncBanner() {
  const [online, setOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null)

  useEffect(() => {
    // Initial check
    setOnline(isOnline())
    setQueueCount(getOfflineQueue().length)

    // Register service worker if supported
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA Service Worker] Registered successfully", reg.scope))
        .catch((err) => console.error("[PWA Service Worker] Registration failed", err))
    }

    const handleOnline = async () => {
      setOnline(true)
      const currentQueue = getOfflineQueue()
      if (currentQueue.length > 0) {
        setIsSyncing(true)
        setSyncStatusText(`Internet restored! Syncing ${currentQueue.length} offline changes...`)
        const result = await flushOfflineQueue((synced, total) => {
          setSyncStatusText(`Syncing ${synced} of ${total} offline actions...`)
        })
        setIsSyncing(false)
        if (result.count > 0) {
          setSyncStatusText(`✅ Synced ${result.count} offline changes!`)
          setTimeout(() => setSyncStatusText(null), 4000)
        } else {
          setSyncStatusText(null)
        }
      }
    }

    const handleOffline = () => {
      setOnline(false)
    }

    const handleQueueChange = () => {
      setQueueCount(getOfflineQueue().length)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("offline-queue-changed", handleQueueChange)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("offline-queue-changed", handleQueueChange)
    }
  }, [])

  // If online, no pending queue, and no recent sync status message, render nothing
  if (online && queueCount === 0 && !syncStatusText) {
    return null
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-3 px-4 rounded-full border border-white/40 dark:border-white/10 shadow-2xl flex items-center justify-between gap-3 text-xs pointer-events-auto bg-background/90 backdrop-blur-xl">
        {!online ? (
          <>
            <div className="flex items-center gap-2.5 text-amber-500 font-bold">
              <div className="size-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <WifiOff className="size-4 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-foreground">Offline Mode</span>
                <span className="text-[11px] text-muted-foreground font-medium block">Edits saved locally & will auto-sync when online.</span>
              </div>
            </div>
            {queueCount > 0 && (
              <span className="px-3 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold rounded-full shrink-0 border border-amber-500/20">
                {queueCount} Pending
              </span>
            )}
          </>
        ) : isSyncing ? (
          <div className="flex items-center gap-2.5 text-primary font-bold w-full">
            <RefreshCw className="size-4 animate-spin text-primary shrink-0" />
            <span className="truncate">{syncStatusText}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold w-full">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="truncate">{syncStatusText}</span>
          </div>
        )}
      </div>
    </div>
  )
}
