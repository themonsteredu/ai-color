import { useEffect, useRef, useState } from 'react'
import type { FacePoint } from '../face/types'
import type { MakeupState } from '../types'

interface PhotoCanvasProps {
  imageUrl: string
  makeup: MakeupState
  landmarks?: FacePoint[] | null
  ariaLabel?: string
}

interface CanvasSize {
  width: number
  height: number
}

interface Point {
  x: number
  y: number
}

interface FaceFrame {
  center: Point
  width: number
  height: number
  leftEye: { center: Point; width: number }
  rightEye: { center: Point; width: number }
  leftBrow: Point[]
  rightBrow: Point[]
  lipOuter: Point[]
  lipCenter: Point
  lipWidth: number
  lipHeight: number
  noseTip: Point
  chin: Point
}

/** 최종 이미지 비율 4:5 */
const ASPECT = 1.25
/** 화면이 작아도 이 아래로는 내려가지 않습니다. */
const MIN_WIDTH = 480
/** 메모리와 그리기 비용을 감안한 상한 */
const MAX_WIDTH = 1600
/** 원본보다 크게 그려도 화질은 좋아지지 않으므로 이 배율까지만 허용합니다. */
const MAX_SOURCE_SCALE = 1.35

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) return `rgba(0,0,0,${alpha})`
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, size: CanvasSize) {
  const scale = Math.max(size.width / image.naturalWidth, size.height / image.naturalHeight)
  const sourceWidth = size.width / scale
  const sourceHeight = size.height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size.width, size.height)
  return { sourceX, sourceY, sourceWidth, sourceHeight }
}

/** 얼굴 랜드마크가 있으면 정확한 좌표로, 없으면 비율 기반으로 얼굴 구조를 만듭니다. */
function buildFrame(
  landmarks: FacePoint[] | null | undefined,
  image: HTMLImageElement,
  cover: { sourceX: number; sourceY: number; sourceWidth: number; sourceHeight: number },
  size: CanvasSize,
): FaceFrame {
  if (landmarks && landmarks.length > 400) {
    const at = (index: number): Point => {
      const point = landmarks[index]
      return {
        x: ((point.x * image.naturalWidth - cover.sourceX) / cover.sourceWidth) * size.width,
        y: ((point.y * image.naturalHeight - cover.sourceY) / cover.sourceHeight) * size.height,
      }
    }
    const left = at(234)
    const right = at(454)
    const top = at(10)
    const chin = at(152)
    const width = Math.hypot(right.x - left.x, right.y - left.y)
    const height = Math.hypot(chin.x - top.x, chin.y - top.y)
    const eye = (outer: number, inner: number, upper: number, lower: number) => {
      const o = at(outer)
      const i = at(inner)
      const u = at(upper)
      const l = at(lower)
      return {
        center: { x: (o.x + i.x + u.x + l.x) / 4, y: (o.y + i.y + u.y + l.y) / 4 },
        width: Math.hypot(i.x - o.x, i.y - o.y),
      }
    }
    const lipOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146].map(at)
    const lipLeft = at(61)
    const lipRight = at(291)
    const lipTop = at(0)
    const lipBottom = at(17)
    return {
      center: { x: (left.x + right.x) / 2, y: (top.y + chin.y) / 2 },
      width,
      height,
      leftEye: eye(33, 133, 159, 145),
      rightEye: eye(263, 362, 386, 374),
      leftBrow: [70, 63, 105, 66, 107].map(at),
      rightBrow: [300, 293, 334, 296, 336].map(at),
      lipOuter,
      lipCenter: { x: (lipLeft.x + lipRight.x) / 2, y: (lipTop.y + lipBottom.y) / 2 },
      lipWidth: Math.hypot(lipRight.x - lipLeft.x, lipRight.y - lipLeft.y),
      lipHeight: Math.max(8, Math.hypot(lipBottom.x - lipTop.x, lipBottom.y - lipTop.y)),
      noseTip: at(1),
      chin,
    }
  }

  // 얼굴 인식을 사용할 수 없을 때의 평균 비율 근사값 (정면 상반신 사진 기준)
  const center = { x: size.width * 0.5, y: size.height * 0.34 }
  const width = size.width * 0.34
  const height = width * 1.36
  const eyeY = center.y - height * 0.05
  const eyeOffset = width * 0.23
  const eyeWidth = width * 0.26
  const browY = eyeY - height * 0.13
  const brow = (direction: number): Point[] =>
    [-0.5, -0.25, 0, 0.25, 0.5].map((t) => ({
      x: center.x + direction * eyeOffset + t * eyeWidth * 1.25 * direction,
      y: browY - Math.cos(t * Math.PI) * height * 0.012,
    }))
  const lipCenter = { x: center.x, y: center.y + height * 0.31 }
  const lipWidth = width * 0.42
  const lipHeight = width * 0.19
  const lipOuter = Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2
    const bow = Math.cos(angle) ** 2
    return {
      x: lipCenter.x + Math.cos(angle) * (lipWidth / 2),
      y: lipCenter.y + Math.sin(angle) * (lipHeight / 2) * (Math.sin(angle) < 0 ? 0.82 + bow * 0.2 : 1),
    }
  })
  return {
    center,
    width,
    height,
    leftEye: { center: { x: center.x - eyeOffset, y: eyeY }, width: eyeWidth },
    rightEye: { center: { x: center.x + eyeOffset, y: eyeY }, width: eyeWidth },
    leftBrow: brow(-1),
    rightBrow: brow(1),
    lipOuter,
    lipCenter,
    lipWidth,
    lipHeight,
    noseTip: { x: center.x, y: center.y + height * 0.16 },
    chin: { x: center.x, y: center.y + height * 0.5 },
  }
}

function softEllipse(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radiusX: number,
  radiusY: number,
  color: string,
  alpha: number,
  rotation = 0,
  blur = 0.24,
) {
  if (alpha <= 0.002) return
  ctx.save()
  ctx.filter = `blur(${Math.max(3, radiusX * blur)}px)`
  ctx.fillStyle = hexToRgba(color, alpha)
  ctx.beginPath()
  ctx.ellipse(center.x, center.y, radiusX, radiusY, rotation, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y)
    else ctx.lineTo(point.x, point.y)
  })
  ctx.closePath()
}

function paintBase(ctx: CanvasRenderingContext2D, frame: FaceFrame, base: string, size: CanvasSize) {
  if (base === '글로우') {
    ctx.save()
    ctx.globalCompositeOperation = 'soft-light'
    const gradient = ctx.createRadialGradient(
      frame.center.x,
      frame.center.y,
      frame.width * 0.1,
      frame.center.x,
      frame.center.y,
      frame.width * 0.95,
    )
    gradient.addColorStop(0, 'rgba(255,247,235,0.55)')
    gradient.addColorStop(1, 'rgba(255,247,235,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.restore()
  }
  if (base === '매트') {
    softEllipse(ctx, frame.center, frame.width * 0.62, frame.height * 0.56, '#F0E3D6', 0.16, 0, 0.42)
  }
}

function paintBrows(ctx: CanvasRenderingContext2D, frame: FaceFrame, style: string) {
  const strength = style === '또렷한 아치' ? 0.34 : style === '소프트 아치' ? 0.2 : 0.24
  const arch = style === '또렷한 아치' ? 1 : style === '소프트 아치' ? 0.5 : 0
  const thickness = frame.width * (style === '또렷한 아치' ? 0.045 : 0.036)
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.filter = `blur(${frame.width * 0.012}px)`
  ctx.strokeStyle = hexToRgba('#6A5346', strength)
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ;[frame.leftBrow, frame.rightBrow].forEach((brow) => {
    if (brow.length < 2) return
    ctx.beginPath()
    brow.forEach((point, index) => {
      const lift = arch * frame.height * 0.016 * Math.sin((index / (brow.length - 1)) * Math.PI)
      if (index === 0) ctx.moveTo(point.x, point.y - lift)
      else ctx.lineTo(point.x, point.y - lift)
    })
    ctx.stroke()
  })
  ctx.restore()
}

function paintEyes(ctx: CanvasRenderingContext2D, frame: FaceFrame, color: string, intensity: number, style: string, liner: string, lashes: string) {
  const alpha = (intensity / 100) * 0.5
  const eyes = [frame.leftEye, frame.rightEye]

  eyes.forEach((eye, index) => {
    const direction = index === 0 ? -1 : 1
    const lidHeight = eye.width * 0.42
    if (style === '그라데이션') {
      softEllipse(ctx, { x: eye.center.x, y: eye.center.y - lidHeight * 0.5 }, eye.width * 0.66, lidHeight * 0.72, color, alpha * 0.55, 0, 0.3)
      softEllipse(ctx, { x: eye.center.x + direction * eye.width * 0.28, y: eye.center.y - lidHeight * 0.28 }, eye.width * 0.36, lidHeight * 0.5, color, alpha, 0, 0.22)
    } else if (style === '포인트 컬러') {
      softEllipse(ctx, { x: eye.center.x, y: eye.center.y - lidHeight * 0.42 }, eye.width * 0.62, lidHeight * 0.62, color, alpha * 0.42, 0, 0.32)
      softEllipse(ctx, { x: eye.center.x + direction * eye.width * 0.4, y: eye.center.y - lidHeight * 0.15 }, eye.width * 0.3, lidHeight * 0.42, color, alpha * 1.15, 0, 0.18)
    } else if (style === '쉬머') {
      softEllipse(ctx, { x: eye.center.x, y: eye.center.y - lidHeight * 0.45 }, eye.width * 0.62, lidHeight * 0.66, color, alpha * 0.8, 0, 0.28)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      softEllipse(ctx, { x: eye.center.x, y: eye.center.y - lidHeight * 0.35 }, eye.width * 0.34, lidHeight * 0.3, '#FFF3DC', alpha * 0.9, 0, 0.2)
      ctx.restore()
    } else {
      softEllipse(ctx, { x: eye.center.x, y: eye.center.y - lidHeight * 0.45 }, eye.width * 0.6, lidHeight * 0.62, color, alpha, 0, 0.3)
    }

    if (liner !== '없음') {
      const lineWidth = eye.width * (liner === '또렷하게' ? 0.1 : liner === '윙' ? 0.085 : 0.06)
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.filter = `blur(${eye.width * 0.02}px)`
      ctx.strokeStyle = hexToRgba('#3A2E29', liner === '내추럴' ? 0.55 : 0.8)
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(eye.center.x - direction * eye.width * 0.52, eye.center.y - eye.width * 0.04)
      ctx.quadraticCurveTo(eye.center.x, eye.center.y - eye.width * 0.2, eye.center.x + direction * eye.width * 0.5, eye.center.y - eye.width * 0.06)
      if (liner === '윙') {
        ctx.lineTo(eye.center.x + direction * eye.width * 0.72, eye.center.y - eye.width * 0.22)
      }
      ctx.stroke()
      ctx.restore()
    }

    if (lashes !== '내추럴') {
      const length = eye.width * (lashes === '볼륨' ? 0.2 : 0.16)
      const count = lashes === '볼륨' ? 7 : 5
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = hexToRgba('#332823', lashes === '볼륨' ? 0.72 : 0.55)
      ctx.lineWidth = eye.width * (lashes === '볼륨' ? 0.035 : 0.024)
      ctx.lineCap = 'round'
      for (let step = 0; step < count; step += 1) {
        const t = step / (count - 1) - 0.5
        const startX = eye.center.x + t * eye.width * 0.9
        const startY = eye.center.y - eye.width * 0.1 - Math.cos(t * Math.PI) * eye.width * 0.05
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(startX + direction * length * 0.35, startY - length)
        ctx.stroke()
      }
      ctx.restore()
    }
  })
}

function paintBlush(ctx: CanvasRenderingContext2D, frame: FaceFrame, color: string, intensity: number, placement: string) {
  const alpha = (intensity / 100) * 0.38
  const offsets =
    placement === '광대 위'
      ? { x: 0.3, y: 0.02, rx: 0.19, ry: 0.09, rotate: -0.25 }
      : placement === '사선'
        ? { x: 0.29, y: 0.09, rx: 0.2, ry: 0.085, rotate: -0.42 }
        : { x: 0.25, y: 0.12, rx: 0.17, ry: 0.12, rotate: 0 }
  ;[-1, 1].forEach((direction) => {
    softEllipse(
      ctx,
      { x: frame.center.x + direction * frame.width * offsets.x, y: frame.center.y + frame.height * offsets.y },
      frame.width * offsets.rx,
      frame.width * offsets.ry,
      color,
      alpha,
      direction * offsets.rotate,
      0.34,
    )
  })
}

function paintLips(ctx: CanvasRenderingContext2D, frame: FaceFrame, color: string, intensity: number, finish: string) {
  const alpha = (intensity / 100) * (finish === '매트' ? 0.72 : finish === '틴트' ? 0.55 : 0.62)
  if (alpha <= 0.01) return
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.filter = `blur(${Math.max(1.4, frame.lipWidth * (finish === '그라데이션' ? 0.055 : 0.025))}px)`
  if (finish === '그라데이션') {
    const gradient = ctx.createRadialGradient(
      frame.lipCenter.x,
      frame.lipCenter.y,
      frame.lipWidth * 0.05,
      frame.lipCenter.x,
      frame.lipCenter.y,
      frame.lipWidth * 0.6,
    )
    gradient.addColorStop(0, hexToRgba(color, Math.min(0.95, alpha * 1.5)))
    gradient.addColorStop(1, hexToRgba(color, 0))
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = hexToRgba(color, alpha)
  }
  tracePath(ctx, frame.lipOuter)
  ctx.fill()
  ctx.restore()

  if (finish === '글로시') {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    softEllipse(
      ctx,
      { x: frame.lipCenter.x, y: frame.lipCenter.y - frame.lipHeight * 0.16 },
      frame.lipWidth * 0.18,
      frame.lipHeight * 0.16,
      '#FFF6E9',
      0.5,
      0,
      0.3,
    )
    ctx.restore()
  }
}

function paintHighlighter(ctx: CanvasRenderingContext2D, frame: FaceFrame, level: string) {
  if (level === '없음') return
  const alpha = level === '글로우' ? 0.42 : 0.24
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  softEllipse(ctx, { x: frame.noseTip.x, y: frame.center.y + frame.height * 0.04 }, frame.width * 0.045, frame.height * 0.14, '#FFF7EA', alpha, 0, 0.5)
  ;[-1, 1].forEach((direction) => {
    softEllipse(
      ctx,
      { x: frame.center.x + direction * frame.width * 0.31, y: frame.center.y - frame.height * 0.02 },
      frame.width * 0.11,
      frame.width * 0.05,
      '#FFF7EA',
      alpha,
      direction * -0.3,
      0.45,
    )
  })
  ctx.restore()
}

function paintShading(ctx: CanvasRenderingContext2D, frame: FaceFrame, level: string) {
  if (level === '없음') return
  const alpha = level === '또렷하게' ? 0.3 : 0.17
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ;[-1, 1].forEach((direction) => {
    softEllipse(
      ctx,
      { x: frame.center.x + direction * frame.width * 0.47, y: frame.center.y + frame.height * 0.08 },
      frame.width * 0.1,
      frame.height * 0.2,
      '#9C7B62',
      alpha,
      direction * 0.16,
      0.6,
    )
  })
  softEllipse(ctx, { x: frame.center.x, y: frame.chin.y - frame.height * 0.03 }, frame.width * 0.16, frame.height * 0.05, '#9C7B62', alpha * 0.7, 0, 0.7)
  ctx.restore()
}

function paintPoint(ctx: CanvasRenderingContext2D, frame: FaceFrame, point: string) {
  if (point === '없음') return
  if (point === '글리터') {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ;[frame.leftEye, frame.rightEye].forEach((eye) => {
      for (let index = 0; index < 14; index += 1) {
        const angle = (index / 14) * Math.PI * 2
        const radius = eye.width * (0.2 + (index % 3) * 0.12)
        ctx.fillStyle = index % 2 === 0 ? 'rgba(255,246,224,0.92)' : 'rgba(255,222,236,0.85)'
        ctx.beginPath()
        ctx.arc(
          eye.center.x + Math.cos(angle) * radius,
          eye.center.y - eye.width * 0.24 + Math.sin(angle) * radius * 0.4,
          Math.max(1, eye.width * 0.035),
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
    })
    ctx.restore()
    return
  }
  // 주근깨
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = 'rgba(150,104,74,0.4)'
  for (let index = 0; index < 26; index += 1) {
    const side = index % 2 === 0 ? -1 : 1
    const spread = ((index * 37) % 100) / 100
    const x = frame.center.x + side * frame.width * (0.08 + spread * 0.3)
    const y = frame.center.y + frame.height * (0.06 + (((index * 53) % 100) / 100) * 0.12)
    ctx.beginPath()
    ctx.arc(x, y, Math.max(1, frame.width * 0.008), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function PhotoCanvas({ imageUrl, makeup, landmarks, ariaLabel = '메이크업 미리보기' }: PhotoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [size, setSize] = useState<CanvasSize>({ width: MIN_WIDTH, height: Math.round(MIN_WIDTH * ASPECT) })

  // 사진은 한 번만 디코딩해 두고, 메이크업이 바뀔 때마다 다시 그리기만 합니다.
  useEffect(() => {
    if (!imageUrl) return
    let cancelled = false
    const source = new Image()
    source.onload = () => {
      if (!cancelled) setImage(source)
    }
    source.src = imageUrl
    return () => {
      cancelled = true
      source.onload = null
    }
  }, [imageUrl])

  // 화면에 표시되는 크기 × 화면 배율만큼 캔버스 해상도를 올려 흐릿함을 없앱니다.
  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement ?? canvas
    if (!canvas || !host) return

    let mediaQuery: MediaQueryList | null = null

    const apply = () => {
      const displayWidth = canvas.clientWidth || host.clientWidth
      if (!displayWidth) return
      const ratio = window.devicePixelRatio || 1
      // 원본 사진보다 크게 잡으면 확대만 될 뿐이라 소스 크기로 상한을 둡니다.
      const sourceLimit = image ? image.naturalWidth * MAX_SOURCE_SCALE : MAX_WIDTH
      const width = Math.round(
        Math.min(MAX_WIDTH, sourceLimit, Math.max(MIN_WIDTH, displayWidth * ratio)),
      )
      setSize((current) => (Math.abs(current.width - width) < 8 ? current : { width, height: Math.round(width * ASPECT) }))
    }

    // 화면 배율(DPR)은 창을 다른 모니터로 옮기거나 확대할 때만 바뀌며,
    // ResizeObserver 로는 감지되지 않습니다.
    const watchPixelRatio = () => {
      mediaQuery?.removeEventListener('change', onRatioChange)
      mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      mediaQuery.addEventListener('change', onRatioChange)
    }
    function onRatioChange() {
      apply()
      watchPixelRatio()
    }

    apply()
    watchPixelRatio()

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => apply()) : null
    observer?.observe(host)
    return () => {
      observer?.disconnect()
      mediaQuery?.removeEventListener('change', onRatioChange)
    }
  }, [image])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size.width
    canvas.height = size.height
    ctx.clearRect(0, 0, size.width, size.height)
    const cover = drawCover(ctx, image, size)
    const frame = buildFrame(landmarks, image, cover, size)
    const { options } = makeup
    paintBase(ctx, frame, options.base, size)
    paintShading(ctx, frame, options.shading)
    paintBlush(ctx, frame, makeup.blush.hex, makeup.blush.intensity, options.blushPlacement)
    paintBrows(ctx, frame, options.brow)
    paintEyes(ctx, frame, makeup.eye.hex, makeup.eye.intensity, options.eyeStyle, options.eyeliner, options.lashes)
    paintLips(ctx, frame, makeup.lip.hex, makeup.lip.intensity, options.lipFinish)
    paintHighlighter(ctx, frame, options.highlighter)
    paintPoint(ctx, frame, options.point)
  }, [image, makeup, landmarks, size])

  return <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
}
