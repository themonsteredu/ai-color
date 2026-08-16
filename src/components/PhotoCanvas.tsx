import { useEffect, useRef } from 'react'
import type { FacePoint } from '../face/types'
import type { FacePlacement, MakeupState } from '../types'

interface PhotoCanvasProps {
  imageUrl: string
  outfitColor?: string
  makeup?: MakeupState
  landmarks?: FacePoint[] | null
  placement: FacePlacement
  className?: string
  ariaLabel?: string
}

interface CoverTransform {
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number): CoverTransform {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
  return { sourceX, sourceY, sourceWidth, sourceHeight }
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const value = Number.parseInt(clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function paintOutfit(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, placement: FacePlacement) {
  const centerX = placement.x * width
  const faceRadius = placement.scale * width
  const shoulderY = Math.min(height * 0.72, placement.y * height + faceRadius * 1.2)

  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = hexToRgba(color, 0.66)
  ctx.beginPath()
  ctx.moveTo(0, height)
  ctx.lineTo(0, shoulderY + faceRadius * 0.2)
  ctx.quadraticCurveTo(centerX - faceRadius * 1.8, shoulderY - faceRadius * 0.35, centerX - faceRadius * 0.68, shoulderY - faceRadius * 0.18)
  ctx.quadraticCurveTo(centerX, shoulderY + faceRadius * 0.42, centerX + faceRadius * 0.68, shoulderY - faceRadius * 0.18)
  ctx.quadraticCurveTo(centerX + faceRadius * 1.8, shoulderY - faceRadius * 0.35, width, shoulderY + faceRadius * 0.2)
  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function paintMakeupWithLandmarks(ctx: CanvasRenderingContext2D, width: number, height: number, makeup: MakeupState, landmarks: FacePoint[], image: HTMLImageElement, cover: CoverTransform) {
  const point = (index: number) => {
    const landmark = landmarks[index]
    return {
      x: ((landmark.x * image.naturalWidth - cover.sourceX) / cover.sourceWidth) * width,
      y: ((landmark.y * image.naturalHeight - cover.sourceY) / cover.sourceHeight) * height,
    }
  }
  const drawSoftEllipse = (center: { x: number; y: number }, radiusX: number, radiusY: number, color: string, alpha: number) => {
    ctx.save()
    ctx.filter = `blur(${Math.max(3, radiusX * 0.18)}px)`
    ctx.fillStyle = hexToRgba(color, alpha)
    ctx.beginPath()
    ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const leftCheek = point(123)
  const rightCheek = point(352)
  const faceLeft = point(234)
  const faceRight = point(454)
  const faceWidth = Math.abs(faceRight.x - faceLeft.x)
  drawSoftEllipse(leftCheek, faceWidth * 0.12, faceWidth * 0.075, makeup.blush.color, makeup.blush.intensity / 300)
  drawSoftEllipse(rightCheek, faceWidth * 0.12, faceWidth * 0.075, makeup.blush.color, makeup.blush.intensity / 300)

  const eyePairs = [[33, 133], [362, 263]]
  ctx.save()
  ctx.filter = `blur(${Math.max(1, faceWidth * 0.012)}px)`
  ctx.fillStyle = hexToRgba(makeup.eye.color, makeup.eye.intensity / 220)
  for (const [outerIndex, innerIndex] of eyePairs) {
    const outer = point(outerIndex)
    const inner = point(innerIndex)
    const centerX = (outer.x + inner.x) / 2
    const centerY = (outer.y + inner.y) / 2
    ctx.beginPath()
    ctx.ellipse(centerX, centerY - faceWidth * 0.02, Math.abs(inner.x - outer.x) * 0.58, faceWidth * 0.035, 0, Math.PI, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  const lipIndexes = [61, 40, 37, 0, 267, 270, 291, 321, 314, 17, 84, 91]
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = hexToRgba(makeup.lip.color, makeup.lip.intensity / 155)
  ctx.beginPath()
  lipIndexes.forEach((index, pathIndex) => {
    const lip = point(index)
    if (pathIndex === 0) ctx.moveTo(lip.x, lip.y)
    else ctx.lineTo(lip.x, lip.y)
  })
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function paintMakeupFallback(ctx: CanvasRenderingContext2D, width: number, height: number, makeup: MakeupState, placement: FacePlacement) {
  const x = placement.x * width
  const y = placement.y * height
  const radius = placement.scale * width

  const blushAlpha = makeup.blush.intensity / 280
  if (blushAlpha > 0) {
    ctx.save()
    ctx.filter = `blur(${Math.max(4, radius * 0.12)}px)`
    ctx.fillStyle = hexToRgba(makeup.blush.color, blushAlpha)
    for (const direction of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(x + direction * radius * 0.48, y + radius * 0.25, radius * 0.28, radius * 0.17, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  const eyeAlpha = makeup.eye.intensity / 230
  if (eyeAlpha > 0) {
    ctx.save()
    ctx.filter = `blur(${Math.max(1.5, radius * 0.035)}px)`
    ctx.fillStyle = hexToRgba(makeup.eye.color, eyeAlpha)
    for (const direction of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(x + direction * radius * 0.34, y - radius * 0.2, radius * 0.25, radius * 0.075, direction * 0.04, Math.PI, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  const lipAlpha = makeup.lip.intensity / 170
  if (lipAlpha > 0) {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = hexToRgba(makeup.lip.color, lipAlpha)
    ctx.beginPath()
    ctx.moveTo(x - radius * 0.28, y + radius * 0.43)
    ctx.quadraticCurveTo(x - radius * 0.1, y + radius * 0.34, x, y + radius * 0.4)
    ctx.quadraticCurveTo(x + radius * 0.1, y + radius * 0.34, x + radius * 0.28, y + radius * 0.43)
    ctx.quadraticCurveTo(x, y + radius * 0.58, x - radius * 0.28, y + radius * 0.43)
    ctx.fill()
    ctx.restore()
  }
}

export function PhotoCanvas({ imageUrl, outfitColor, makeup, landmarks, placement, className = '', ariaLabel = '사진 미리보기' }: PhotoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const image = new Image()
    image.onload = () => {
      const width = 720
      const height = 900
      canvas.width = width
      canvas.height = height
      context.clearRect(0, 0, width, height)
      const cover = drawCover(context, image, width, height)
      if (outfitColor) paintOutfit(context, width, height, outfitColor, placement)
      if (makeup && landmarks?.length) paintMakeupWithLandmarks(context, width, height, makeup, landmarks, image, cover)
      else if (makeup) paintMakeupFallback(context, width, height, makeup, placement)
    }
    image.src = imageUrl
    return () => {
      image.onload = null
    }
  }, [imageUrl, outfitColor, makeup, landmarks, placement])

  return <canvas ref={canvasRef} className={`photo-canvas ${className}`} role="img" aria-label={ariaLabel} />
}

