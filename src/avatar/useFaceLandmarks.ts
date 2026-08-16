import { useEffect, useState } from 'react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import type { FacePoint } from './types'

let landmarkerPromise: Promise<FaceLandmarker> | null = null

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = import('@mediapipe/tasks-vision').then(async ({ FaceLandmarker, FilesetResolver }) => {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm')
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
    })
  }
  return landmarkerPromise
}

export function useFaceLandmarks(photoUrl: string) {
  const [landmarks, setLandmarks] = useState<FacePoint[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'manual'>('idle')

  useEffect(() => {
    if (!photoUrl) return
    let cancelled = false
    const image = new Image()
    setStatus('loading')
    image.onload = async () => {
      try {
        const landmarker = await getLandmarker()
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
    image.onerror = () => setStatus('manual')
    image.src = photoUrl
    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [photoUrl])

  return { landmarks, status }
}

