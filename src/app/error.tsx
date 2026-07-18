'use client'

import { useEffect } from 'react'
import { WifiOff, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  // Determine if it looks like a network error
  const isNetworkError = error.message.toLowerCase().includes('fetch') || 
                         error.message.toLowerCase().includes('network') ||
                         error.message.toLowerCase().includes('offline')

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6 shadow-sm">
        {isNetworkError ? (
          <WifiOff className="h-12 w-12 text-red-500 dark:text-red-400" />
        ) : (
          <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400" />
        )}
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
        {isNetworkError ? "Connection Lost" : "Something went wrong"}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        {isNetworkError 
          ? "It looks like your internet connection is down or the website is currently offline. Please check your connection and try again."
          : "We encountered an unexpected error while trying to load this page. Our team has been notified."}
      </p>
      <div className="flex gap-4">
        <Button 
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 shadow-md"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
