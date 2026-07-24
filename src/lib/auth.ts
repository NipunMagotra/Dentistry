import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'

const JWT_SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || 'clinic-os-secure-tenant-session-secret'
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET)
export const AUTH_COOKIE_NAME = 'auth_token'

export interface AuthSession {
  email: string
  tenantId: string
  role: string
}

export async function signAuthToken(payload: AuthSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)
}

export async function verifyAuthToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return {
      email: (payload.email as string) || '',
      tenantId: (payload.tenantId as string) || (payload.tenant_id as string) || '',
      role: (payload.role as string) || 'authenticated'
    }
  } catch (err) {
    return null
  }
}

export async function setSessionCookie(session: AuthSession) {
  const cookieStore = await cookies()
  const token = await signAuthToken(session)
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })
  return token
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null
  return await verifyAuthToken(token)
}

export async function requireAuth(expectedTenantId?: string): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    throw new Error('UNAUTHORIZED: Authentication required.')
  }

  const headersList = await headers()
  const requestTenantId = expectedTenantId || headersList.get('x-tenant-id')

  if (requestTenantId && session.tenantId) {
    const reqTenantStr = String(requestTenantId).toLowerCase()
    const sessTenantStr = String(session.tenantId).toLowerCase()
    if (reqTenantStr !== sessTenantStr) {
      throw new Error('FORBIDDEN: You do not have permission to access this clinic dashboard.')
    }
  }

  return session
}
