import crypto from 'crypto'

/**
 * Encrypts a string using AES-256-CBC.
 * Returns a string formatted as "ivHex:encryptedHex"
 */
export function encryptPassword(password: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables')
  }

  const iv = crypto.randomBytes(16)
  const key = Buffer.from(encryptionKey, 'hex') // 32 bytes
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(password), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

/**
 * Decrypts a string encrypted with AES-256-CBC.
 * Expects the format "ivHex:encryptedHex"
 */
export function decryptPassword(encrypted: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables')
  }

  const [ivHex, encryptedHex] = encrypted.split(':')
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted password format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const key = Buffer.from(encryptionKey, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()])
  return decrypted.toString()
}
