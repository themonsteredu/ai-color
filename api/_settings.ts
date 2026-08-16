import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export interface ImageSettings {
  apiKey: string
  model: string
  quality: 'low' | 'medium' | 'high' | 'auto'
  size: '1024x1024' | '1024x1536' | '1536x1024' | 'auto'
}

export const SETTINGS_COOKIE = 'color_mate_ai_settings'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function encryptionKey() {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY
  if (!secret || secret.length < 24) return null
  return createHash('sha256').update(secret, 'utf8').digest()
}

export function settingsStorageReady() {
  return Boolean(encryptionKey() && process.env.SETTINGS_PIN)
}

export function verifySettingsPin(pin: string) {
  const expected = process.env.SETTINGS_PIN
  if (!expected) return false
  const left = Buffer.from(pin)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function encryptSettings(settings: ImageSettings) {
  const key = encryptionKey()
  if (!key) throw new Error('SETTINGS_ENCRYPTION_KEY를 먼저 설정해 주세요.')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(settings), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.')
}

export function decryptSettings(value?: string): ImageSettings | null {
  const key = encryptionKey()
  if (!key || !value) return null
  try {
    const [ivPart, tagPart, encryptedPart] = value.split('.')
    if (!ivPart || !tagPart || !encryptedPart) return null
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64url'))
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedPart, 'base64url')), decipher.final()]).toString('utf8')
    return JSON.parse(decrypted) as ImageSettings
  } catch {
    return null
  }
}

export function cookieValue(cookieHeader?: string) {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === SETTINGS_COOKIE) return value.join('=')
  }
  return undefined
}

export function readCookieSettings(cookieHeader?: string) {
  return decryptSettings(cookieValue(cookieHeader))
}

export function settingsCookie(value: string) {
  const secure = process.env.VERCEL ? '; Secure' : ''
  return `${SETTINGS_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}${secure}`
}

export function clearSettingsCookie() {
  const secure = process.env.VERCEL ? '; Secure' : ''
  return `${SETTINGS_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}

export function environmentSettings(): ImageSettings | null {
  if (!process.env.OPENAI_API_KEY) return null
  return {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5',
    quality: (process.env.OPENAI_IMAGE_QUALITY || 'medium') as ImageSettings['quality'],
    size: (process.env.OPENAI_IMAGE_SIZE || '1024x1536') as ImageSettings['size'],
  }
}

export function resolveImageSettings(cookieHeader?: string) {
  return readCookieSettings(cookieHeader) ?? environmentSettings()
}
