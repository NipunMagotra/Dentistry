import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits - optimal length for AES-GCM (NIST SP 800-38D)
const AUTH_TAG_LENGTH = 16 // 128 bits - standard tag length

// Derive 32-byte key safely using SHA-256 HKDF/Hash
function getSecretKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_SECRET is not defined in production environment!')
    }
    // Fallback secret for local development
    return crypto.createHash('sha256').update('clinic-os-fallback-encryption-secret-32-chars!').digest()
  }

  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptNotes(text: string): string {
  if (!text) return ''
  
  // 1. Cryptographically secure 96-bit IV generated fresh per operation
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getSecretKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // 2. Extract 128-bit authentication tag
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Return format: IV:AuthTag:Ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decryptNotes(encryptedPayload: string): string {
  if (!encryptedPayload) return ''
  
  try {
    const parts = encryptedPayload.split(':')
    if (parts.length !== 3) {
      // Return plain text if legacy/unencrypted
      return encryptedPayload
    }
    
    const [ivHex, authTagHex, encryptedText] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    // Verify IV and AuthTag lengths
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid IV or Authentication Tag length')
    }

    const key = getSecretKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    // 3. Set Auth Tag before deciphering to trigger constant-time tag verification in OpenSSL
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt notes:', error)
    return '[Encrypted Notes - Integrity Verification Failed]'
  }
}
