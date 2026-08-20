import { useEffect, useState } from 'react'
import { getImageLandmarker } from './landmarker'
import type { FacePoint } from './types'

export function useFaceLandmarks(photoUrl: string) {
  const [landmarks, setLandmarks] = useState<FacePoint[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'manual'>('idle')

  useEffect(() => {
    if (!photoUrl) return
    let cancelled = false
    const image = new Image()
    setStatus('loading')
    setLandmarks(null)
    image.onload = async () => {
      try {
        const landmarker = await getImageLandmarker()
        if (cancelled) return
        const result = landmarker.detect(image)
        if (cancelled) return
        const face = result.faceLandmarks[0]
        if (face?.length) {
          setLandmarks(face.map(({ x, y, z }) => ({ x, y, z })))
          setStatus('ready')
        } else {
          setStatus('manual')
        }
      } catch {
        if (!cancelled) setStatus('manual')
      }
    }
    image.onerror = () => {
      if (!cancelled) setStatus('manual')
    }
    image.src = photoUrl
    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [photoUrl])

  return { landmarks, status }
}

/** 업로드한 사진 등 임의의 이미지에서 한 번만 랜드마크를 구합니다. */
export async function detectLandmarks(image: HTMLImageElement): Promise<FacePoint[] | null> {
  try {
    const landmarker = await getImageLandmarker()
    const face = landmarker.detect(image).faceLandmarks[0]
    return face?.length ? face.map(({ x, y, z }) => ({ x, y, z })) : null
  } catch {
    return null
  }
}
