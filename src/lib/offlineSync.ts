"use client"

import { createAppointment, updateAppointmentStatus, deletePatient, createSecurePrescription } from "@/app/actions"

export interface OfflineAction {
  id: string
  type: "BOOK_APPOINTMENT" | "UPDATE_STATUS" | "DELETE_PATIENT" | "CREATE_PRESCRIPTION"
  payload: any
  timestamp: number
}

const QUEUE_STORAGE_KEY = "clinic_os_offline_action_queue"

export function isOnline(): boolean {
  if (typeof window === "undefined") return true
  return navigator.onLine
}

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error("Failed to read offline queue", e)
    return []
  }
}

export function queueOfflineAction(type: OfflineAction["type"], payload: any): OfflineAction {
  const queue = getOfflineQueue()
  const newAction: OfflineAction = {
    id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    timestamp: Date.now()
  }

  queue.push(newAction)
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
    window.dispatchEvent(new Event("offline-queue-changed"))
  } catch (e) {
    console.error("Failed to write to offline queue", e)
  }

  return newAction
}

export function clearOfflineQueue() {
  if (typeof window === "undefined") return
  localStorage.removeItem(QUEUE_STORAGE_KEY)
  window.dispatchEvent(new Event("offline-queue-changed"))
}

export async function flushOfflineQueue(onProgress?: (synced: number, total: number) => void): Promise<{ success: boolean; count: number }> {
  if (!isOnline()) return { success: false, count: 0 }

  const queue = getOfflineQueue()
  if (queue.length === 0) return { success: true, count: 0 }

  let syncedCount = 0
  const remaining: OfflineAction[] = []

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    try {
      if (item.type === "BOOK_APPOINTMENT") {
        await createAppointment(item.payload)
      } else if (item.type === "UPDATE_STATUS") {
        await updateAppointmentStatus(item.payload.id, item.payload.status)
      } else if (item.type === "DELETE_PATIENT") {
        await deletePatient(item.payload.id)
      } else if (item.type === "CREATE_PRESCRIPTION") {
        await createSecurePrescription(item.payload)
      }
      syncedCount++
      if (onProgress) onProgress(syncedCount, queue.length)
    } catch (err) {
      console.error(`[Offline Sync] Failed to sync action ${item.id}`, err)
      remaining.push(item)
    }
  }

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining))
    window.dispatchEvent(new Event("offline-queue-changed"))
    window.dispatchEvent(new CustomEvent("offline-sync-completed", { detail: { count: syncedCount } }))
  } catch (e) {
    console.error(e)
  }

  return { success: true, count: syncedCount }
}
