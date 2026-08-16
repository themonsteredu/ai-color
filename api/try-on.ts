import OpenAI, { toFile } from 'openai'

interface ApiRequest {
  method?: string
  body: unknown
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

interface TryOnBody {
  personImage?: string
  garments?: GarmentInput[]
  studentCode?: string
  generationNumber?: number
}

const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5'
const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium'
const size = process.env.OPENAI_IMAGE_SIZE || '1024x1536'
const generationLimit = Number(process.env.TRYON_GENERATION_LIMIT || 2)

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new Error('지원하지 않는 이미지 형식입니다.')
  return { mimeType: match[1], bytes: Buffer.from(match[2], 'base64') }
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'garment'
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'POST 요청만 지원합니다.' })
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ error: 'OPENAI_API_KEY가 아직 설정되지 않았어요.' })

  try {
    const body = request.body as TryOnBody
    const personImage = body.personImage
    const garments = body.garments
    const generationNumber = Number(body.generationNumber)

    if (!personImage || !Array.isArray(garments) || garments.length < 2 || garments.length > 4) {
      return response.status(400).json({ error: '학생 사진과 2~4개의 의상 이미지가 필요합니다.' })
    }
    if (!body.studentCode || body.studentCode.length > 30) return response.status(400).json({ error: '올바른 활동 코드가 필요합니다.' })
    if (!Number.isInteger(generationNumber) || generationNumber < 1 || generationNumber > generationLimit) {
      return response.status(429).json({ error: `학생당 가상착의는 ${generationLimit}회까지만 만들 수 있어요.` })
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
    const prompt = [
      'Use case: identity-preserve virtual try-on for a student personal-color activity.',
      'Image 1 is the student photo. Images 2 onward are the exact selected garment references.',
      `Dress the student in this complete outfit: ${outfitDescription}.`,
      'Change only the clothing and selected accessory.',
      'Preserve the student’s face, identity, expression, hair, skin tone, body proportions, pose, hands, camera angle, lighting, and background exactly.',
      'Keep the outfit age-appropriate, modest, realistic, and faithful to the reference colors, materials, seams, and silhouette.',
      'Make fabric drape, folds, occlusion, and shadows physically plausible.',
      'Do not apply makeup, beautification, face reshaping, skin retouching, body reshaping, extra jewelry, logos, text, or a watermark.',
    ].join('\n')

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
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
    const message = error instanceof Error ? error.message : '가상착의 생성 중 오류가 발생했습니다.'
    return response.status(500).json({ error: message })
  }
}
