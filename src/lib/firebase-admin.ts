import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { headers } from 'next/headers'

function getAdminApp() {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
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

export async function getTenantDb() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    throw new Error('No tenant ID found in headers. Ensure middleware is passing x-tenant-id.')
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
