import type { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

type Vision = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>

/**
 * 얼굴 인식 실행 파일 위치.
 * 학교망에서 외부 CDN 이 막혀 있어도 동작하도록 자체 호스팅을 먼저 시도하고,
 * (빌드 시 public/mediapipe 로 준비됩니다) 실패하면 CDN 으로 대체합니다.
 */
const SOURCES = [
  {
    wasm: '/mediapipe/wasm',
    model: '/mediapipe/face_landmarker.task',
  },
  {
    wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm',
    model: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  },
] as const

const visionCache = new Map<string, Promise<Vision>>()

async function loadVision(wasmBase: string) {
  const cached = visionCache.get(wasmBase)
  if (cached) return cached
  const promise = import('@mediapipe/tasks-vision')
    .then(({ FilesetResolver: Resolver }) => Resolver.forVisionTasks(wasmBase))
    .catch((error) => {
      visionCache.delete(wasmBase)
      throw error
    })
  visionCache.set(wasmBase, promise)
  return promise
}

async function build(runningMode: 'IMAGE' | 'VIDEO', wasmBase: string, model: string, delegate: 'GPU' | 'CPU') {
  const vision = await loadVision(wasmBase)
  const { FaceLandmarker: Landmarker } = await import('@mediapipe/tasks-vision')
  return Landmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: model, delegate },
    runningMode,
    numFaces: 1,
    minFaceDetectionConfidence: 0.4,
    minFacePresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  })
}

async function create(runningMode: 'IMAGE' | 'VIDEO') {
  let lastError: unknown = new Error('얼굴 인식을 사용할 수 없어요.')
  for (const source of SOURCES) {
    // 일부 노트북·브라우저에서는 GPU delegate 가 동작하지 않아 CPU 로 다시 시도합니다.
    for (const delegate of ['GPU', 'CPU'] as const) {
      try {
        return await build(runningMode, source.wasm, source.model, delegate)
      } catch (error) {
        lastError = error
      }
    }
  }
  throw lastError
}

let imagePromise: Promise<FaceLandmarker> | null = null

/** 정지 사진용 공용 인스턴스 (재사용) */
export async function getImageLandmarker() {
  if (!imagePromise) {
    imagePromise = create('IMAGE').catch((error) => {
      imagePromise = null
      throw error
    })
  }
  return imagePromise
}

/** 실시간 미리보기용 인스턴스. 사용이 끝나면 호출한 쪽에서 close() 해야 합니다. */
export function createVideoLandmarker() {
  return create('VIDEO')
}

let prefetched = false

/**
 * 얼굴 인식 실행 파일(약 15MB)을 미리 브라우저 캐시에 받아 둡니다.
 * 실패해도 무시하며, 실제 로딩은 필요한 시점에 다시 시도합니다.
 */
export function prefetchLandmarkerAssets() {
  if (prefetched || typeof fetch !== 'function') return
  prefetched = true
  const [local] = SOURCES
  void Promise.all(
    [local.model, `${local.wasm}/vision_wasm_internal.wasm`].map((url) =>
      fetch(url, { cache: 'force-cache' }).catch(() => undefined),
    ),
  )
}
