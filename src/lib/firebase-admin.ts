import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { headers } from 'next/headers'
import { getSession } from './auth'

function getAdminApp() {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && rawPrivateKey) {
    try {
      let formattedKey = rawPrivateKey.replace(/\\n/g, '\n')
      if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
        formattedKey = formattedKey.slice(1, -1)
      }
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      })
    } catch (err) {
      console.error('[Firebase Admin] Warning: Failed to parse private key from env, falling back to default app init:', err)
    }
  }

  // Fallback for dev / mock build environment when env vars are not set yet
  return initializeApp({
    projectId: projectId || 'clinic-os-dev',
  })
}

export function getFirestoreDb() {
  const app = getAdminApp()
  return getFirestore(app)
}

export async function getTenantDb(overrideTenantId?: string) {
  let tenantId = overrideTenantId
  if (!tenantId) {
    try {
      const session = await getSession()
      if (session?.tenantId) {
        tenantId = session.tenantId
      }
    } catch {}

    if (!tenantId) {
      try {
        const headersList = await headers()
        const headerTenant = headersList.get('x-tenant-id')
        const referer = headersList.get('referer')
        
        if (headerTenant) {
          tenantId = headerTenant
        } else if (referer) {
          try {
            const url = new URL(referer)
            const segs = url.pathname.split('/').filter(Boolean)
            if (segs.length > 0 && segs[0] !== 'home' && segs[0] !== 'api') {
              tenantId = segs[0].toLowerCase()
            }
          } catch {}
        }
      } catch {}
    }

    if (!tenantId) {
      tenantId = 'default-clinic'
    }
  }

  const db = getFirestoreDb()
  const clinicRef = db.collection('clinics').doc(tenantId)

  return {
    db,
    tenantId,
    clinicRef,
    patientsRef: clinicRef.collection('patients'),
    appointmentsRef: clinicRef.collection('appointments'),
    doctorsRef: clinicRef.collection('doctors'),
    prescriptionsRef: clinicRef.collection('prescriptions'),
  }
}
