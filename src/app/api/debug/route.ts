import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const results: Record<string, any> = {
    version: '1.5.4',
    timestamp: new Date().toISOString(),
    checks: {},
  }

  // 1. Check environment variables
  results.checks.env = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? `SET (${process.env.FIREBASE_PROJECT_ID})` : 'MISSING',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? `SET (${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20)}...)` : 'MISSING',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY.length}, starts: ${process.env.FIREBASE_PRIVATE_KEY.substring(0, 30)}...)` : 'MISSING',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'MISSING (using fallback)',
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET ? 'SET' : 'MISSING',
  }

  // 2. Test Firebase Admin SDK initialization
  try {
    const { getFirestoreDb, hasFirebaseCredentials } = await import('@/lib/firebase-admin')
    const hasCreds = hasFirebaseCredentials()
    
    if (!hasCreds) {
      results.checks.firebaseInit = 'WARNING: Firebase environment variables missing or incomplete'
      results.checks.firestoreWrite = 'SKIPPED: Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY'
      results.checks.firestoreRead = 'SKIPPED: Missing Firebase credentials'
      return NextResponse.json(results, { status: 200 })
    }

    const db = getFirestoreDb()
    results.checks.firebaseInit = 'SUCCESS'

    // 3. Test Firestore write
    const testDocId = `debug_test_${Date.now()}`
    try {
      await db.collection('_debug_tests').doc(testDocId).set({
        message: 'Debug connectivity test',
        created_at: new Date().toISOString(),
      })
      results.checks.firestoreWrite = 'SUCCESS'
    } catch (writeErr: any) {
      results.checks.firestoreWrite = `FAILED: ${writeErr.message || String(writeErr)}`
    }

    // 4. Test Firestore read
    try {
      const testDoc = await db.collection('_debug_tests').doc(testDocId).get()
      results.checks.firestoreRead = testDoc.exists ? 'SUCCESS' : 'FAILED: doc does not exist after write'
    } catch (readErr: any) {
      results.checks.firestoreRead = `FAILED: ${readErr.message || String(readErr)}`
    }

    // 5. Clean up test doc
    try {
      await db.collection('_debug_tests').doc(testDocId).delete()
    } catch {}

    // 6. List all top-level collections
    try {
      const collections = await db.listCollections()
      results.checks.collections = collections.map(c => c.id)
    } catch (colErr: any) {
      results.checks.collections = `FAILED: ${colErr.message || String(colErr)}`
    }

    // 7. Check for accounts
    try {
      const accountsSnap = await db.collection('accounts').limit(5).get()
      results.checks.accountsCount = accountsSnap.size
      results.checks.accountEmails = accountsSnap.docs.map(d => d.id)
    } catch (accErr: any) {
      results.checks.accounts = `FAILED: ${accErr.message || String(accErr)}`
    }

    // 8. Try to find appointments in ALL clinics
    try {
      const clinicsSnap = await db.collection('clinics').listDocuments()
      const clinicIds = clinicsSnap.map(d => d.id)
      results.checks.clinicIds = clinicIds

      for (const clinicId of clinicIds.slice(0, 5)) {
        const aptsSnap = await db.collection('clinics').doc(clinicId).collection('appointments').limit(10).get()
        results.checks[`appointments_${clinicId}`] = {
          count: aptsSnap.size,
          docs: aptsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        }
      }
    } catch (clinicErr: any) {
      results.checks.clinics = `FAILED: ${clinicErr.message || String(clinicErr)}`
    }

  } catch (initErr: any) {
    results.checks.firebaseInit = `FAILED: ${initErr.message || String(initErr)}`
  }

  return NextResponse.json(results, { status: 200 })
}
