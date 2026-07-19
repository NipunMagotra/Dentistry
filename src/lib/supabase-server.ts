import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'
import { headers, cookies } from 'next/headers'

// Initialize the Supabase client with a custom JWT that includes the tenant_id
export async function getTenantSupabase() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    throw new Error('No tenant ID found in headers. Ensure middleware is passing x-tenant-id.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieStore = await cookies()
  const token = cookieStore.get('tenant_session')?.value

  if (!token) {
    throw new Error('No tenant_session cookie found. Ensure proxy.ts is setting the cookie securely.')
  }

  // Initialize client using the custom JWT in the authorization header
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })

  return { supabase, tenantId }
}
