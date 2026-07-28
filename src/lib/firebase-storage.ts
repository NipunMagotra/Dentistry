import { getStorage } from 'firebase-admin/storage'
import { getApps } from 'firebase-admin/app'

// Ensure the admin app is initialized by importing the Firestore helper
// which triggers getAdminApp() internally
import { getFirestoreDb } from './firebase-admin'

export type MedicalMedia = {
  id: string
  url: string
  storagePath: string
  caption?: string
  category: 'xray' | 'lab_report' | 'other'
  uploadedAt: string
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function getStorageBucket() {
  // Trigger admin app initialization via Firestore import side-effect
  getFirestoreDb()
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || 'dentistry-a00f1'}.firebasestorage.app`
  const storage = getStorage()
  return storage.bucket(bucketName)
}

/**
 * Validate a file before upload.
 */
export function validateMediaFile(file: { size: number; type: string; name: string }) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed. Accepted: JPEG, PNG, WebP, PDF.` }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File "${file.name}" exceeds the 10 MB size limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` }
  }
  return { valid: true, error: null }
}

/**
 * Upload a medical media file to Firebase Storage.
 * Path: /clinics/{tenantId}/patients/{patientId}/xrays/{timestamp}_{sanitizedFilename}
 */
export async function uploadMedicalMedia(
  tenantId: string,
  patientId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  category: MedicalMedia['category'] = 'xray',
  caption?: string
): Promise<MedicalMedia> {
  const bucket = getStorageBucket()

  // Sanitize filename: remove special chars, keep extension
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const timestamp = Date.now()
  const storagePath = `clinics/${tenantId}/patients/${patientId}/xrays/${timestamp}_${sanitizedName}`

  const file = bucket.file(storagePath)

  await file.save(fileBuffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        tenantId,
        patientId,
        category,
        caption: caption || '',
        uploadedAt: new Date().toISOString(),
      },
    },
  })

  // Generate a signed URL for secure access (7-day expiry)
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })

  const mediaId = `media_${timestamp}_${Math.random().toString(36).substring(2, 7)}`

  return {
    id: mediaId,
    url: signedUrl,
    storagePath,
    caption: caption || undefined,
    category,
    uploadedAt: new Date().toISOString(),
  }
}

/**
 * Delete a media file from Firebase Storage.
 */
export async function deleteMedicalMedia(storagePath: string): Promise<void> {
  try {
    const bucket = getStorageBucket()
    const file = bucket.file(storagePath)
    await file.delete()
    console.log(`[Firebase Storage] Deleted: ${storagePath}`)
  } catch (err: any) {
    if (err?.code === 404) {
      console.warn(`[Firebase Storage] File not found (already deleted): ${storagePath}`)
      return
    }
    throw err
  }
}

/**
 * Generate a fresh signed URL for an existing storage path.
 */
export async function getSignedMediaUrl(storagePath: string): Promise<string> {
  const bucket = getStorageBucket()
  const file = bucket.file(storagePath)
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })
  return signedUrl
}
