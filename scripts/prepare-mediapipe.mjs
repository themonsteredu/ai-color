/**
 * 얼굴 인식(MediaPipe) 실행 파일을 public/ 으로 준비합니다.
 *
 * 외부 CDN 이 막힌 학교망에서도 촬영 가이드가 동작하도록 자체 호스팅합니다.
 * - wasm : node_modules 에 이미 들어 있어 그대로 복사합니다.
 * - 모델 : 최초 1회만 내려받고, 이미 있으면 건너뜁니다.
 * 실패해도 빌드는 계속되며, 이 경우 앱이 CDN 으로 자동 대체합니다.
 */
import { createWriteStream } from 'node:fs'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'mediapipe')
const wasmDir = join(outDir, 'wasm')
const wasmSource = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const modelPath = join(outDir, 'face_landmarker.task')

const exists = async (path) => {
  try {
    return (await stat(path)).size > 0
  } catch {
    return false
  }
}

async function copyWasm() {
  await mkdir(wasmDir, { recursive: true })
  // SIMD 빌드만 복사합니다. (최신 브라우저는 모두 지원하며 용량이 절반입니다)
  for (const file of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
    await copyFile(join(wasmSource, file), join(wasmDir, file))
  }
}

async function downloadModel() {
  if (await exists(modelPath)) return 'cached'
  const response = await fetch(MODEL_URL)
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(modelPath))
  return 'downloaded'
}

try {
  await copyWasm()
  const state = await downloadModel()
  console.log(`[mediapipe] 준비 완료 (모델 ${state === 'cached' ? '재사용' : '다운로드'})`)
} catch (error) {
  console.warn(`[mediapipe] 자체 호스팅 준비 실패 — 실행 중 CDN 으로 대체합니다: ${error.message}`)
}
