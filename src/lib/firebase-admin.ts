import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { headers } from 'next/headers'
import { getSession } from './auth'

function sanitizePrivateKey(rawKey: string): string {
  let key = rawKey.trim()
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  return key.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r/g, '')
}

export function hasFirebaseCredentials(): boolean {
  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT
  if (jsonKey) return true
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim()
  return !!(projectId && clientEmail && rawPrivateKey)
}

function getAdminApp() {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]!
  }

  // 1. Support single JSON key string (e.g. pasted directly from GCP Service Account JSON)
  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT
  if (jsonKey) {
    try {
      const parsed = typeof jsonKey === 'string' ? JSON.parse(jsonKey) : jsonKey
      if (parsed.private_key) {
        parsed.private_key = sanitizePrivateKey(parsed.private_key)
      }
      console.log('[Firebase Admin] Initializing with FIREBASE_SERVICE_ACCOUNT_KEY JSON string.')
      const app = initializeApp({
        credential: cert(parsed),
      })
      console.log('[Firebase Admin] ✅ Successfully initialized with JSON service account credentials')
      return app
    } catch (err) {
      console.error('[Firebase Admin] ❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err)
    }
  }

  // 2. Support individual env vars
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && rawPrivateKey) {
    try {
      const formattedKey = sanitizePrivateKey(rawPrivateKey)
      console.log(`[Firebase Admin] Initializing with SERVICE ACCOUNT credentials. Project: ${projectId}, Email: ${clientEmail.substring(0, 20)}..., Key length: ${formattedKey.length}`)
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      })
      console.log('[Firebase Admin] ✅ Successfully initialized with service account credentials')
      return app
    } catch (err) {
      console.error('[Firebase Admin] ❌ CRITICAL: Failed to initialize with service account credentials. Firestore writes WILL FAIL:', err)
    }
  } else {
    console.warn(`[Firebase Admin] ⚠️ Missing env vars - projectId: ${!!projectId}, clientEmail: ${!!clientEmail}, privateKey: ${!!rawPrivateKey}`)
  }

  // Fallback for dev / mock build environment when env vars are not set yet
  console.warn('[Firebase Admin] ⚠️ Using NO-CREDENTIAL fallback (projectId only). Firestore operations will likely fail!')
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
