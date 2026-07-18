import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6 shadow-sm">
        <FileQuestion className="h-12 w-12 text-slate-400 dark:text-slate-500" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Page not found</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        We couldn't find the page you're looking for. It might have been moved, or the link you followed may be broken.
      </p>
      <Link href="/">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 shadow-md">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}
