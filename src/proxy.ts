import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SignJWT } from 'jose'

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

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get("host") || "localhost:3000"
  const searchParams = req.nextUrl.searchParams.toString()
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
  
  let currentHost = hostname
  if (hostname.endsWith(`.${rootDomain}`)) {
      currentHost = hostname.replace(`.${rootDomain}`, "")
  }

  let resolvedTenantId = ""
  let isPathBased = false

  // Detect if we are on a root domain (or vercel app domain)
  if (currentHost === rootDomain || currentHost === "www" || currentHost.startsWith("localhost") || currentHost.includes("vercel.app")) {
    if (url.pathname === "/") {
      const response = NextResponse.rewrite(new URL(`/home${searchParams.length > 0 ? `?${searchParams}` : ""}`, req.url))
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      return response
    }

    // Extract tenant from path for free Vercel testing (e.g. /city-dental)
    const segments = url.pathname.split("/").filter(Boolean)
    if (segments.length > 0 && segments[0] !== "home") {
      resolvedTenantId = segments[0]
      isPathBased = true
    } else {
      // If path is /home or something else without a tenant, let it pass
      const response = NextResponse.next()
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      return response
    }
  } else {
    // We are on a custom subdomain (e.g. city-dental.yourbrand.com)
    resolvedTenantId = currentHost
  }

  // Set the tenant ID in headers for Server Actions to read
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-tenant-id', resolvedTenantId)

  // Rewrite the URL if it came from a subdomain
  const rewriteUrl = isPathBased
    ? new URL(path, req.url) // Already has the path, just pass through
    : new URL(`/${resolvedTenantId}${path === "/" ? "" : path}`, req.url) // Rewrite subdomain to path

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  })

  // Add HSTS Header globally
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // Generate and set Secure JWT Cookie for Tenant Session
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (jwtSecret) {
    const secret = new TextEncoder().encode(jwtSecret)
    const token = await new SignJWT({ 
        role: 'authenticated', 
        tenant_id: resolvedTenantId 
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    // Store custom JWT securely as an HTTP-only cookie
    response.cookies.set({
      name: 'tenant_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 // 1 hour
    })
  }

  return response
}
