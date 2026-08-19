import { Camera, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { MakeupState } from '../types'

interface OpenMakeupInstance {
  init: () => Promise<void>
  apply: (category: string, options: Record<string, unknown>) => Promise<void>
  clear: (category: string) => void
  dispose: () => void
}

interface OpenMakeupMirrorProps {
  makeup: MakeupState
  fallback: ReactNode
}

const CAMERA_UTILS = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js'
const FACE_MESH = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
const SDK_MODULE = 'https://cdn.jsdelivr.net/npm/open-makeup-sdk/+esm'
const SDK_ASSETS = 'https://cdn.jsdelivr.net/npm/open-makeup-sdk/assets'
const MEDIAPIPE_ASSETS = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619'

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve()
      else existing.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => { script.dataset.loaded = 'true'; resolve() }
    script.onerror = () => reject(new Error('메이크업 엔진을 불러오지 못했어요.'))
    document.head.appendChild(script)
  })
}

export function OpenMakeupMirror({ makeup, fallback }: OpenMakeupMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<OpenMakeupInstance | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      try {
        if (!videoRef.current || !canvasRef.current) return
        await Promise.all([loadScript(CAMERA_UTILS), loadScript(FACE_MESH)])
        const sdkUrl = SDK_MODULE
        const module = await import(/* @vite-ignore */ sdkUrl) as { OpenMakeup: new (options: Record<string, unknown>) => OpenMakeupInstance }
        if (cancelled) return
        const engine = new module.OpenMakeup({
          video: videoRef.current,
          renderCanvas: canvasRef.current,
          assetsBaseUrl: SDK_ASSETS,
          mediapipeBaseUrl: MEDIAPIPE_ASSETS,
        })
        engineRef.current = engine
        await engine.init()
        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('fallback')
      }
    }
    void boot()
    return () => {
      cancelled = true
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || status !== 'ready') return
    const apply = async () => {
      try {
        if (makeup.lip.intensity <= 0) engine.clear('lipstick')
        else await engine.apply('lipstick', { color: makeup.lip.color, finish: 'matte' })
        if (makeup.blush.intensity <= 0) engine.clear('blush')
        else await engine.apply('blush', { color: makeup.blush.color, finish: 'matte' })
        if (makeup.eye.intensity <= 0) engine.clear('eyeshadow')
        else await engine.apply('eyeshadow', { color: makeup.eye.color, finish: 'matte', pattern: 1 })
      } catch {
        setStatus('fallback')
      }
    }
    void apply()
  }, [makeup, status])

  if (status === 'fallback') return (
    <div>
      {fallback}
      <p className="input-help"><TriangleAlert size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />이 기기에서는 실시간 메이크업을 사용할 수 없어 사진 미리보기로 전환했어요.</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 420, borderRadius: 24, overflow: 'hidden', background: '#f3f1ed' }}>
      <video ref={videoRef} playsInline muted style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', minHeight: 420, objectFit: 'cover' }} aria-label="실시간 메이크업 미러" />
      {status === 'loading' ? <div className="generating-cover"><LoaderCircle className="spin" size={34} /><strong>무료 메이크업 미러 준비 중</strong><span><Camera size={14} /> 카메라 권한을 허용해 주세요</span></div> : null}
    </div>
  )
}
