import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getTenantDb } from '@/lib/firebase-admin'
import { uploadMedicalMedia, validateMediaFile } from '@/lib/firebase-storage'
import type { MedicalMedia } from '@/lib/firebase-storage'
import { FieldValue } from 'firebase-admin/firestore'

const MAX_FILES_PER_BATCH = 5

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    // 2. Parse FormData
    const formData = await request.formData()
    const patientId = formData.get('patientId') as string
    const category = (formData.get('category') as MedicalMedia['category']) || 'xray'
    const caption = (formData.get('caption') as string) || ''
    const tenantIdOverride = formData.get('tenantId') as string

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required.' }, { status: 400 })
    }

    // Collect all files from the form
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key === 'files') {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided.' }, { status: 400 })
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES_PER_BATCH} files per upload.` }, { status: 400 })
    }

    // 3. Resolve tenant
    const tenantId = tenantIdOverride || session.tenantId || 'default-clinic'

    // 4. Validate & Upload each file
    const uploadedMedia: MedicalMedia[] = []
    const errors: string[] = []

    for (const file of files) {
      const validation = validateMediaFile({
        size: file.size,
        type: file.type,
        name: file.name,
      })

      if (!validation.valid) {
        errors.push(validation.error!)
        continue
      }

      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const media = await uploadMedicalMedia(
          tenantId,
          patientId,
          buffer,
          file.name,
          file.type,
          category,
          caption
        )

        uploadedMedia.push(media)
      } catch (uploadErr: any) {
        console.error(`[Upload API] Failed to upload "${file.name}":`, uploadErr)
        errors.push(`Failed to upload "${file.name}": ${uploadErr.message || 'Unknown error'}`)
      }
    }

    // 5. Persist media metadata to Firestore patient document
    if (uploadedMedia.length > 0) {
      try {
        const { patientsRef } = await getTenantDb(tenantId)
        await patientsRef.doc(patientId).update({
          medical_media: FieldValue.arrayUnion(...uploadedMedia),
          updated_at: new Date().toISOString(),
        })
      } catch (firestoreErr: any) {
        console.error('[Upload API] Failed to update Firestore patient doc:', firestoreErr)
        // Files are uploaded to Storage but metadata wasn't saved — return partial success
        return NextResponse.json({
          success: true,
          partial: true,
          uploaded: uploadedMedia,
          errors: [...errors, 'Files uploaded but metadata save failed. They may not appear in patient records.'],
        })
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    console.error('[Upload API] Unhandled error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
