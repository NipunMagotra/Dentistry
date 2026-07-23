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
  
  // 1. Normalize host (strip port numbers and convert to lowercase)
  const rawHost = req.headers.get("host") || "localhost:3000"
  const hostWithoutPort = rawHost.split(":")[0].toLowerCase()
  
  const rawRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
  const rootDomainClean = rawRootDomain.split(":")[0].toLowerCase()
  
  const searchParams = url.searchParams.toString()
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`

  let currentHost = hostWithoutPort
  if (hostWithoutPort.endsWith(`.${rootDomainClean}`)) {
    currentHost = hostWithoutPort.replace(`.${rootDomainClean}`, "")
  }

  let resolvedTenantId = ""
  let isPathBased = false

  // Detect root domain, localhost, or vercel staging app
  if (currentHost === rootDomainClean || currentHost === "www" || currentHost.startsWith("localhost") || currentHost.includes("vercel.app")) {
    if (url.pathname === "/") {
      const response = NextResponse.rewrite(new URL(`/home${searchParams.length > 0 ? `?${searchParams}` : ""}`, req.url))
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      response.headers.set('Cache-Control', 'no-store, max-age=0')
      return response
    }

    const segments = url.pathname.split("/").filter(Boolean)
    if (segments.length > 0 && segments[0] !== "home") {
      resolvedTenantId = segments[0].toLowerCase()
      isPathBased = true
    } else {
      const response = NextResponse.next()
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      return response
    }
  } else {
    // Custom subdomain
    resolvedTenantId = currentHost.toLowerCase()
  }

  // 2. Overwrite x-tenant-id header (prevents header spoofing)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-tenant-id', resolvedTenantId)

  const rewriteUrl = isPathBased
    ? new URL(path, req.url)
    : new URL(`/${resolvedTenantId}${path === "/" ? "" : path}`, req.url)

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  })

  // 3. Prevent Edge CDN Cross-Tenant Cache Leakage
  response.headers.set('Vary', 'Host, x-tenant-id')
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // 4. Tenant Session JWT Cookie
  const jwtSecret = process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || 'clinic-os-secure-tenant-session-secret'
  const secret = new TextEncoder().encode(jwtSecret)
  const token = await new SignJWT({ 
      role: 'authenticated', 
      tenant_id: resolvedTenantId 
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)

  response.cookies.set({
    name: 'tenant_session',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600
  })

  return response
}
