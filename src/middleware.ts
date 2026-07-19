import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any files with an extension (like .svg, .png, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl

  // Get the hostname of the request (e.g. apollo.localhost:3000)
  const hostname = req.headers.get("host") || "localhost:3000"

  // Get the path and search params
  const searchParams = req.nextUrl.searchParams.toString()
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`

  // Define the root domain (use an environment variable in production, e.g., 'yoursaas.com')
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
  
  // Extract the subdomain
  let currentHost = hostname
  if (hostname.endsWith(`.${rootDomain}`)) {
      currentHost = hostname.replace(`.${rootDomain}`, "")
  }

  // VERCEL MVP OVERRIDE:
  // If we set NEXT_PUBLIC_DEMO_TENANT in Vercel and the user navigates to /demo-dashboard, 
  // route them to the tenant dashboard so we can demo the complete auth flow.
  const demoTenant = process.env.NEXT_PUBLIC_DEMO_TENANT
  if (demoTenant && url.pathname.startsWith("/demo-dashboard")) {
    return NextResponse.rewrite(new URL(`/${demoTenant}`, req.url))
  }

  // Handle Root Domain & WWW
  // If the user visits 'localhost:3000' or 'www.yoursaas.com', route to the marketing/home page
  if (currentHost === rootDomain || currentHost === "www" || currentHost === "localhost" || currentHost === "localhost:3000" || currentHost.includes("vercel.app")) {
    // Rewrite to the (marketing) home folder only if it is the root path
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL(`/home${searchParams.length > 0 ? `?${searchParams}` : ""}`, req.url))
    }
    return NextResponse.next()
  }

  // Handle Tenant Subdomains
  // If the user visits 'apollo-dental.localhost:3000', rewrite the path to our dynamic tenant segment
  return NextResponse.rewrite(new URL(`/${currentHost}${path === "/" ? "" : path}`, req.url))
}
