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
  hex: string
  name: string
  intensity: number
}

interface MakeupInput {
  lip: MakeupChoice
  blush: MakeupChoice
  eye: MakeupChoice
  options?: Record<string, string>
}

interface StyleBody {
  personImage?: string
  garments?: GarmentInput[]
  makeup?: MakeupInput
  shoes?: { name?: string; colorName?: string }
  personalColorType?: string
  personalColorLabel?: string
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
  return Math.min(100, Math.max(0, Math.round(value)))
}

function describeMakeup(makeup: MakeupInput) {
  const options = makeup.options ?? {}
  return [
    `lip color ${makeup.lip.hex} (${makeup.lip.name}) at ${clampIntensity(makeup.lip.intensity)}% strength`,
    `blush color ${makeup.blush.hex} (${makeup.blush.name}) at ${clampIntensity(makeup.blush.intensity)}% strength`,
    `eyeshadow color ${makeup.eye.hex} (${makeup.eye.name}) at ${clampIntensity(makeup.eye.intensity)}% strength`,
    `base finish: ${options.base ?? 'natural'}`,
    `eyebrow shape: ${options.brow ?? 'soft arch'}`,
    `eyeshadow application: ${options.eyeStyle ?? 'single color'}`,
    `eyeliner: ${options.eyeliner ?? 'natural'}`,
    `lashes: ${options.lashes ?? 'natural'}`,
    `blush placement: ${options.blushPlacement ?? 'center of cheeks'}`,
    `lip finish: ${options.lipFinish ?? 'tint'}`,
    `highlighter: ${options.highlighter ?? 'none'}`,
    `contour and shading: ${options.shading ?? 'none'}`,
    `point detail: ${options.point ?? 'none'}`,
  ].join('; ')
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'POST 요청만 지원합니다.' })
  const imageSettings = resolveImageSettings(request.headers.cookie)
  if (!imageSettings) return response.status(503).json({ error: '교사용 AI 설정에서 OpenAI API 키를 먼저 등록해 주세요.' })

  try {
    const body = request.body as StyleBody
    const { personImage, garments, makeup, shoes, personalColorType, personalColorLabel } = body
    if (!personImage || !Array.isArray(garments) || garments.length < 2 || garments.length > 4 || !makeup) {
      return response.status(400).json({ error: '학생 사진, 의상 2~4개, 메이크업 선택값이 필요합니다.' })
    }
    if (!body.studentCode || body.studentCode.length > 40) {
      return response.status(400).json({ error: '올바른 수업 코드가 필요합니다.' })
    }
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
    const shoeDescription = shoes?.name ? `${shoes.colorName ?? ''} ${shoes.name}`.trim() : 'simple neutral shoes that match the outfit'

    const prompt = [
      'Create an identity-preserving, school-appropriate final styling image for a personal-color career-experience class.',
      'Image 1 is the student reference photo. It may show only the face, shoulders, or upper body; a full-body source photo is NOT required and must not be requested.',
      'Images 2 onward are the exact garment references the student selected.',
      `Personal-color type confirmed in class: ${personalColorLabel ?? personalColorType ?? 'not specified'}.`,
      `Selected outfit: ${outfitDescription}.`,
      `Selected footwear: ${shoeDescription}.`,
      `Selected makeup design: ${describeMakeup(makeup)}.`,
      '',
      'Identity rules (highest priority):',
      '- Preserve the student’s facial identity and features exactly as in image 1.',
      '- Preserve the hairstyle, hair color, skin tone, and facial proportions.',
      '- Do not reshape the face, do not slim the face or jaw, do not enlarge the eyes.',
      '- Do not whiten or lighten the skin, and do not change apparent ethnicity or age.',
      '- No heavy beauty retouching: keep natural skin texture, pores, and real facial shadows.',
      '',
      'Body rules:',
      '- If the source photo does not show the full body, generate a natural head-to-toe standing portrait by inferring a neutral, age-appropriate body and pose.',
      '- Use realistic proportions for a school-aged student. Never generate an adult-looking or exaggerated body.',
      '- Do not slim, elongate, or otherwise correct the body shape, and do not emphasize body lines.',
      '- The generated body is an illustrationary styling reference, not a claim about the student’s real height or body shape.',
      '',
      'Styling rules:',
      '- Apply the selected top, bottom, outer, accessory, and shoes as closely as possible in color, silhouette, material impression, seams, folds, and layering.',
      '- Apply the selected makeup accurately, including color, intensity, placement, and finish. Makeup must look like real cosmetics on skin, not flat painted shapes or a filter mask.',
      '- Keep everything modest and suitable for a school career-experience class. No revealing, mature, or provocative styling.',
      '- Do not add logos, text, watermarks, or accessories the student did not select.',
      '- Use a simple, clean studio-like background.',
      '- The result should look like a polished, realistic styling photo rather than an illustration or collage.',
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
