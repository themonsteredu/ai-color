import {
  clearSettingsCookie,
  encryptSettings,
  readCookieSettings,
  settingsCookie,
  settingsStorageReady,
  verifySettingsPin,
  type ImageSettings,
} from './_settings.js'

interface ApiRequest {
  method?: string
  body: unknown
  headers: { cookie?: string }
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

interface SettingsBody {
  action?: 'verify' | 'save' | 'clear'
  pin?: string
  apiKey?: string
  model?: string
  quality?: ImageSettings['quality']
  size?: ImageSettings['size']
}

const qualities = new Set(['low', 'medium', 'high', 'auto'])
const sizes = new Set(['1024x1024', '1024x1536', '1536x1024', 'auto'])

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  const current = readCookieSettings(request.headers.cookie)

  if (request.method === 'GET') {
    return response.status(200).json({
      storageReady: settingsStorageReady(),
      configured: Boolean(current),
      model: current?.model,
      quality: current?.quality,
      size: current?.size,
    })
  }

  if (request.method !== 'POST') return response.status(405).json({ error: '지원하지 않는 요청입니다.' })
  const body = request.body as SettingsBody
  if (!settingsStorageReady()) return response.status(503).json({ error: 'Vercel에 SETTINGS_PIN과 SETTINGS_ENCRYPTION_KEY를 먼저 등록해 주세요.' })
  if (!verifySettingsPin(String(body.pin ?? ''))) {
    await new Promise((resolve) => setTimeout(resolve, 450))
    return response.status(401).json({ error: '설정 비밀번호가 올바르지 않습니다.' })
  }
  if (body.action === 'verify') return response.status(200).json({ verified: true, configured: Boolean(current) })

  if (body.action === 'clear') {
    response.setHeader('Set-Cookie', clearSettingsCookie())
    return response.status(200).json({ configured: false })
  }

  if (body.action !== 'save') return response.status(400).json({ error: '올바른 설정 작업이 필요합니다.' })
  const apiKey = body.apiKey?.trim() || current?.apiKey
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 24) return response.status(400).json({ error: '올바른 OpenAI API 키를 입력해 주세요.' })
  if (!body.model?.startsWith('gpt-image-')) return response.status(400).json({ error: '지원되는 OpenAI 이미지 모델을 선택해 주세요.' })
  if (!body.quality || !qualities.has(body.quality)) return response.status(400).json({ error: '올바른 이미지 품질을 선택해 주세요.' })
  if (!body.size || !sizes.has(body.size)) return response.status(400).json({ error: '올바른 이미지 크기를 선택해 주세요.' })

  const settings: ImageSettings = { apiKey, model: body.model, quality: body.quality, size: body.size }
  response.setHeader('Set-Cookie', settingsCookie(encryptSettings(settings)))
  return response.status(200).json({ configured: true, model: settings.model, quality: settings.quality, size: settings.size })
}
