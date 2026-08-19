import OpenAI, { toFile } from 'openai'
import { resolveImageSettings } from './_settings.js'

interface ApiRequest {
  method?: string
  body: unknown
  headers: { cookie?: string }
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
}

interface GarmentInput {
  id: string
  name: string
  category: string
  dataUrl: string
}

interface MakeupChoice {
  color: string
  label: string
  intensity: number
}

interface MakeupInput {
  lip: MakeupChoice
  blush: MakeupChoice
  eye: MakeupChoice
}

interface StyleBody {
  personImage?: string
  garments?: GarmentInput[]
  makeup?: MakeupInput
  studentCode?: string
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new Error('지원하지 않는 이미지 형식입니다.')
  return { mimeType: match[1], bytes: Buffer.from(match[2], 'base64') }
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'garment'
}

function clampIntensity(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(65, Math.max(0, Math.round(value)))
}

function describeMakeup(makeup: MakeupInput) {
  return [
    `lip: ${makeup.lip.label} ${makeup.lip.color}, intensity ${clampIntensity(makeup.lip.intensity)}/65`,
    `blush: ${makeup.blush.label} ${makeup.blush.color}, intensity ${clampIntensity(makeup.blush.intensity)}/65`,
    `eyeshadow: ${makeup.eye.label} ${makeup.eye.color}, intensity ${clampIntensity(makeup.eye.intensity)}/65`,
  ].join('; ')
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'POST 요청만 지원합니다.' })
  const imageSettings = resolveImageSettings(request.headers.cookie)
  if (!imageSettings) return response.status(503).json({ error: '설정 메뉴에서 OpenAI API 키를 먼저 등록해 주세요.' })

  try {
    const body = request.body as StyleBody
    const personImage = body.personImage
    const garments = body.garments
    const makeup = body.makeup

    if (!personImage || !Array.isArray(garments) || garments.length < 2 || garments.length > 4 || !makeup) {
      return response.status(400).json({ error: '학생 사진, 의상 2~4개, 메이크업 선택값이 필요합니다.' })
    }
    if (!body.studentCode || body.studentCode.length > 40) return response.status(400).json({ error: '올바른 수업 코드가 필요합니다.' })
    if (personImage.length > 12_000_000 || garments.some((garment) => garment.dataUrl.length > 2_000_000)) {
      return response.status(413).json({ error: '이미지가 너무 커요. 사진 크기를 줄여 다시 시도해 주세요.' })
    }

    const person = parseDataUrl(personImage)
    const imageInputs = [await toFile(person.bytes, 'student.jpg', { type: person.mimeType })]
    for (const garment of garments) {
      const parsed = parseDataUrl(garment.dataUrl)
      imageInputs.push(await toFile(parsed.bytes, `${safeName(garment.id)}.webp`, { type: parsed.mimeType }))
    }

    const outfitDescription = garments.map((garment) => `${garment.category}: ${garment.name}`).join(', ')
    const makeupDescription = describeMakeup(makeup)
    const prompt = [
      'Use case: identity-preserving final styling for a student personal-color class.',
      'Image 1 is the student photo. Images 2 onward are the exact selected garment references.',
      `Dress the student in this complete outfit: ${outfitDescription}.`,
      `Apply only this selected makeup: ${makeupDescription}.`,
      'The makeup must look like real cosmetics on the existing face, not painted shapes or a beauty filter.',
      'Preserve natural skin texture, pores, facial shadows, lip texture, eyelid shape, eyebrows, and the student’s original facial identity.',
      'Keep makeup intensity faithful to the selected values: low values should be subtle and high values should be clearly visible but still age-appropriate.',
      'Change only the selected clothing, selected accessory, and the specified makeup.',
      'Preserve the student’s identity, expression, hair, facial proportions, skin tone, body proportions, pose, hands, camera angle, lighting, and background.',
      'Do not reshape the face or body. Do not smooth or whiten the skin. Do not add extra jewelry, logos, text, or watermarks.',
      'Keep the outfit realistic and faithful to the reference colors, materials, seams, silhouette, folds, occlusion, and shadows.',
    ].join('\n')

    const { apiKey, model, quality, size } = imageSettings
    const openai = new OpenAI({ apiKey })
    const result = await openai.images.edit({
      model,
      image: imageInputs,
      prompt,
      quality: quality as 'low' | 'medium' | 'high' | 'auto',
      size: size as '1024x1024' | '1024x1536' | '1536x1024' | 'auto',
    })

    const first = result.data?.[0]
    if (!first) throw new Error('OpenAI가 이미지를 반환하지 않았습니다.')
    if (first.b64_json) return response.status(200).json({ imageDataUrl: `data:image/png;base64,${first.b64_json}`, model, quality, size })
    if (first.url) {
      const imageResponse = await fetch(first.url)
      if (!imageResponse.ok) throw new Error('생성 이미지를 가져오지 못했습니다.')
      const base64 = Buffer.from(await imageResponse.arrayBuffer()).toString('base64')
      return response.status(200).json({ imageDataUrl: `data:image/png;base64,${base64}`, model, quality, size })
    }
    throw new Error('OpenAI 이미지 응답 형식을 확인해 주세요.')
  } catch (error) {
    const message = error instanceof Error ? error.message : '최종 스타일 생성 중 오류가 발생했습니다.'
    return response.status(500).json({ error: message })
  }
}
