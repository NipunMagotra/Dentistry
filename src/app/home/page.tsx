import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
        Clinic SaaS Platform
      </h1>
      <p className="text-lg text-slate-500 max-w-xl">
        Welcome to the root domain. In a production environment, this is where your marketing landing page goes.
      </p>
      
      <div className="pt-8 space-y-4 flex flex-col items-center">
        <p className="text-sm font-medium text-slate-600 bg-slate-200 px-4 py-2 rounded-full">
          Demo: To access a clinic dashboard, visit a tenant subdomain.
        </p>
        <p className="text-sm text-slate-500 italic pb-4">
          (e.g., http://apollo-dental.localhost:3000)
        </p>
        <Button render={<Link href="http://apollo-dental.localhost:3000" />} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
          Go to "Apollo Dental" Tenant
        </Button>
      </div>
    </div>
  )
}
