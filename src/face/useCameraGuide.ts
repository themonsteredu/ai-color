import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { createVideoLandmarker } from './landmarker'
import {
  computeCrop,
  evaluateAlignment,
  faceBoxFromLandmarks,
  measureLuma,
  smoothBox,
  type Alignment,
  type AlignmentStatus,
  type FaceBox,
} from './framing'

/** 검출 주기. 너무 자주 돌리면 노트북에서 미리보기가 끊깁니다. */
const DETECT_INTERVAL = 90
const LUMA_INTERVAL = 700
/** 새 판정이 이만큼 이어져야 안내 문구를 바꿉니다. (문구 깜빡임 방지) */
const DWELL_MS = 320
/** 마지막으로 얼굴을 본 뒤 이 시간까지는 그 위치를 그대로 신뢰합니다. */
const FACE_TTL = 600

export type GuideState = 'off' | 'loading' | 'ready' | 'unavailable'

/**
 * 카메라 미리보기에서 실시간으로 얼굴을 찾아 촬영 안내를 만듭니다.
 * 모델을 불러오지 못하면 안내 없이 고정 가이드만 사용하도록 'unavailable' 을 돌려줍니다.
 */
export function useCameraGuide(videoRef: RefObject<HTMLVideoElement | null>, active: boolean) {
  const [alignment, setAlignment] = useState<Alignment>(() => evaluateAlignment(null, null))
  const [guideState, setGuideState] = useState<GuideState>('off')
  const faceRef = useRef<{ box: FaceBox; at: number } | null>(null)

  /** 최근에 확인한 얼굴 위치. 오래된 값은 쓰지 않습니다. */
  const getFace = useCallback(() => {
    const current = faceRef.current
    if (!current) return null
    return performance.now() - current.at <= FACE_TTL ? current.box : null
  }, [])

  useEffect(() => {
    if (!active) {
      faceRef.current = null
      setGuideState('off')
      setAlignment(evaluateAlignment(null, null))
      return
    }

    let cancelled = false
    let landmarker: FaceLandmarker | null = null
    let frame = 0
    let lastDetect = 0
    let lastLuma = 0
    let lastVideoTime = -1
    let luma: number | null = null
    let smoothed: FaceBox | null = null
    let published: AlignmentStatus = 'searching'
    let candidate: AlignmentStatus = 'searching'
    let candidateSince = 0

    setGuideState('loading')

    /**
     * 같은 판정이 DWELL_MS 이상 이어질 때만 화면을 바꿉니다.
     * 후보가 바뀔 때마다 시각을 다시 재기 때문에, 두 상태가 번갈아 나와도
     * 안내가 멈추지 않고 더 오래 유지된 쪽이 반드시 표시됩니다.
     */
    const publish = (next: Alignment, now: number) => {
      if (next.status === published) {
        candidate = published
        return
      }
      if (next.status !== candidate) {
        candidate = next.status
        candidateSince = now
        return
      }
      if (now - candidateSince >= DWELL_MS) {
        published = next.status
        setAlignment(next)
      }
    }

    const loop = (now: number) => {
      if (cancelled) return
      frame = requestAnimationFrame(loop)
      const video = videoRef.current
      if (!landmarker || !video || video.readyState < 2 || video.videoWidth === 0) return
      if (now - lastDetect < DETECT_INTERVAL) return
      lastDetect = now
      // 같은 프레임을 두 번 넣으면 MediaPipe 가 오류를 냅니다.
      if (video.currentTime === lastVideoTime) return
      lastVideoTime = video.currentTime

      const frameWidth = video.videoWidth
      const frameHeight = video.videoHeight

      try {
        const result = landmarker.detectForVideo(video, now)
        const landmarks = result.faceLandmarks[0]
        const box = landmarks?.length ? faceBoxFromLandmarks(landmarks, frameWidth / frameHeight) : null
        if (box) {
          smoothed = smoothBox(smoothed, box)
          faceRef.current = { box: smoothed, at: now }
        } else if (now - (faceRef.current?.at ?? 0) > FACE_TTL) {
          smoothed = null
          faceRef.current = null
        }
      } catch {
        // 한 프레임 실패는 무시하고 다음 프레임에서 다시 시도합니다.
        return
      }

      const face = getFace()
      if (now - lastLuma > LUMA_INTERVAL) {
        lastLuma = now
        // 얼굴 주변만 재야 역광(배경만 밝은 상황)을 놓치지 않습니다.
        const region = face ? computeCrop(face, frameWidth, frameHeight) : undefined
        luma = measureLuma(video, frameWidth, frameHeight, region)
      }

      publish(evaluateAlignment(face, luma, frameHeight, published), now)
    }

    createVideoLandmarker()
      .then((instance) => {
        if (cancelled) {
          instance.close()
          return
        }
        landmarker = instance
        setGuideState('ready')
        frame = requestAnimationFrame(loop)
      })
      .catch(() => {
        if (!cancelled) setGuideState('unavailable')
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      landmarker?.close()
      landmarker = null
    }
  }, [active, videoRef, getFace])

  return { alignment, guideState, getFace }
}
