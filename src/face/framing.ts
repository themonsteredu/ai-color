import type { FacePoint } from './types'

/**
 * 촬영 구도 정의.
 * 최종 사진은 4:5 세로 인물 사진이고, 얼굴(이마 위 ~ 턱)이 전체 높이의 34%,
 * 눈높이가 위에서 40% 지점에 오도록 맞춥니다. (일반적인 상반신 인물 사진 기준)
 */
export const TARGET = {
  /** 최종 이미지 가로 / 세로 */
  aspect: 4 / 5,
  /** 얼굴 높이가 전체 높이에서 차지하는 비율 */
  faceHeight: 0.34,
  /** 눈높이가 위에서 차지하는 비율 */
  eyeLine: 0.4,
  /** 얼굴 가로 / 세로 비율 (타원 가이드용) */
  faceWidthRatio: 0.74,
  /** 얼굴(이마~턱) 안에서 눈높이가 놓이는 위치 */
  eyeInFace: 0.44,
  /** 턱 아래로 어깨선이 시작되는 거리 (얼굴 높이 기준) */
  shoulderBelowChin: 0.45,
  /** 미리보기 화면에서 가이드 박스가 차지하는 세로 비율 */
  guideHeight: 0.94,
  /** 최종 저장 이미지 세로 픽셀 상한 (이보다 크면 줄입니다) */
  outputHeight: 1400,
  /**
   * 확대는 하지 않습니다. 없는 디테일을 만들어 낼 뿐이고,
   * 화면에 크게 보여줄 때는 어차피 브라우저가 늘려 그리기 때문입니다.
   */
  maxUpscale: 1,
} as const

/** MediaPipe FaceLandmarker(468/478 포인트) 인덱스 */
const LM = {
  faceLeft: 234,
  faceRight: 454,
  foreheadTop: 10,
  chin: 152,
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  noseTip: 1,
} as const

export interface FaceBox {
  /** 정규화(0~1) 좌표 — 원본 프레임 기준 */
  centerX: number
  centerY: number
  width: number
  height: number
  /** 두 눈 중심의 세로 위치 (정규화) */
  eyeY: number
  /** 고개 좌우 회전 추정값. 0이면 정면, ±로 갈수록 옆을 봄 */
  yaw: number
  /** 고개 기울기(도) */
  roll: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * @param aspect 원본 프레임의 가로/세로 비율.
 *   랜드마크 좌표는 가로·세로가 각각 따로 정규화되어 있어, 각도를 잴 때
 *   비율 보정을 하지 않으면 16:9 화면에서 최대 78% 까지 틀어집니다.
 */
export function faceBoxFromLandmarks(landmarks: FacePoint[], aspect = 1): FaceBox | null {
  if (!landmarks || landmarks.length < 468) return null
  const at = (index: number) => landmarks[index]
  const left = at(LM.faceLeft)
  const right = at(LM.faceRight)
  const top = at(LM.foreheadTop)
  const chin = at(LM.chin)
  const nose = at(LM.noseTip)
  if (!left || !right || !top || !chin || !nose) return null

  const width = Math.abs(right.x - left.x)
  const height = Math.abs(chin.y - top.y)
  if (width <= 0 || height <= 0) return null

  const leftEye = { x: (at(LM.leftEyeOuter).x + at(LM.leftEyeInner).x) / 2, y: (at(LM.leftEyeOuter).y + at(LM.leftEyeInner).y) / 2 }
  const rightEye = { x: (at(LM.rightEyeOuter).x + at(LM.rightEyeInner).x) / 2, y: (at(LM.rightEyeOuter).y + at(LM.rightEyeInner).y) / 2 }

  // 코끝이 얼굴 좌우 중 어느 쪽에 치우쳤는지로 정면 여부를 추정합니다.
  const toLeft = Math.abs(nose.x - left.x)
  const toRight = Math.abs(right.x - nose.x)
  const yaw = (toLeft - toRight) / width

  const roll = (Math.atan2(rightEye.y - leftEye.y, (rightEye.x - leftEye.x) * aspect) * 180) / Math.PI

  return {
    centerX: (left.x + right.x) / 2,
    centerY: (top.y + chin.y) / 2,
    width,
    height,
    eyeY: (leftEye.y + rightEye.y) / 2,
    yaw,
    roll,
  }
}

/** 지수 평활 — 값이 미세하게 떨리는 것을 줄입니다. */
export function smoothBox(previous: FaceBox | null, next: FaceBox, alpha = 0.35): FaceBox {
  if (!previous) return next
  const mix = (a: number, b: number) => a + (b - a) * alpha
  return {
    centerX: mix(previous.centerX, next.centerX),
    centerY: mix(previous.centerY, next.centerY),
    width: mix(previous.width, next.width),
    height: mix(previous.height, next.height),
    eyeY: mix(previous.eyeY, next.eyeY),
    yaw: mix(previous.yaw, next.yaw),
    roll: mix(previous.roll, next.roll),
  }
}

export type AlignmentStatus = 'searching' | 'too-close' | 'too-far' | 'off-center' | 'not-frontal' | 'tilted' | 'dark' | 'ready'

export interface Alignment {
  status: AlignmentStatus
  message: string
  hint: string
}

const MESSAGES: Record<AlignmentStatus, { message: string; hint: string }> = {
  searching: { message: '얼굴이 보이게 조금 다가와 주세요', hint: '화면 안에 얼굴 전체가 들어오게 정면을 바라보세요' },
  'too-close': { message: '조금 뒤로 가주세요', hint: '얼굴과 어깨가 함께 보일 만큼 떨어져요' },
  'too-far': { message: '조금 앞으로 와주세요', hint: '얼굴이 가이드 안을 채울 만큼 가까이요' },
  'off-center': { message: '가이드 안으로 얼굴을 맞춰주세요', hint: '얼굴이 타원 안에 들어오게 이동해요' },
  'not-frontal': { message: '정면을 바라봐 주세요', hint: '고개를 옆으로 돌리지 않아요' },
  tilted: { message: '고개를 똑바로 세워주세요', hint: '어깨와 눈높이를 수평으로 맞춰요' },
  dark: { message: '조금 더 밝은 곳에서 찍어주세요', hint: '창가처럼 빛이 있는 곳이 좋아요' },
  ready: { message: '좋아요! 이대로 찍어요', hint: '얼굴과 어깨가 잘 잡혔어요' },
}

/**
 * 허용 범위는 넉넉하게 둡니다. 정확한 구도는 촬영 후 자동 프레이밍이 맞춰주므로
 * 학생이 완벽하게 정렬할 필요는 없습니다.
 *
 * 각 항목은 들어갈 때(enter)와 빠져나올 때(exit) 기준을 다르게 두어,
 * 경계에서 안내 문구가 깜빡이지 않게 합니다. (슈미트 트리거)
 */
export const LIMITS = {
  faceTooLarge: { enter: 0.4, exit: 0.36 },
  faceTooSmall: { enter: 0.19, exit: 0.22 },
  /** 저해상도 카메라에서는 비율만으로는 부족해 실제 픽셀 높이도 함께 봅니다. */
  faceMinPixels: 140,
  offCenterX: { enter: 0.15, exit: 0.12 },
  eyeY: { min: 0.16, max: 0.66 },
  yaw: { enter: 0.24, exit: 0.2 },
  roll: { enter: 13, exit: 10 },
  darkLuma: { enter: 46, exit: 54 },
} as const

/**
 * @param frameHeight 원본 프레임 세로 픽셀. 얼굴의 실제 픽셀 크기를 함께 판정합니다.
 * @param previous 직전에 표시한 상태. 같은 상태면 더 느슨한 기준으로 유지합니다.
 */
export function evaluateAlignment(
  box: FaceBox | null,
  luma: number | null,
  frameHeight = 0,
  previous: AlignmentStatus = 'searching',
): Alignment {
  const build = (status: AlignmentStatus): Alignment => ({ status, ...MESSAGES[status] })
  if (!box) return build('searching')

  const limit = <T extends { enter: number; exit: number }>(range: T, status: AlignmentStatus) =>
    previous === status ? range.exit : range.enter

  if (box.height > limit(LIMITS.faceTooLarge, 'too-close')) return build('too-close')
  const facePixels = box.height * frameHeight
  if (box.height < limit(LIMITS.faceTooSmall, 'too-far')) return build('too-far')
  if (frameHeight > 0 && facePixels < LIMITS.faceMinPixels) return build('too-far')
  if (Math.abs(box.centerX - 0.5) > limit(LIMITS.offCenterX, 'off-center')) return build('off-center')
  if (box.eyeY < LIMITS.eyeY.min || box.eyeY > LIMITS.eyeY.max) return build('off-center')
  if (Math.abs(box.yaw) > limit(LIMITS.yaw, 'not-frontal')) return build('not-frontal')
  if (Math.abs(box.roll) > limit(LIMITS.roll, 'tilted')) return build('tilted')
  if (luma !== null && luma < limit(LIMITS.darkLuma, 'dark')) return build('dark')
  return build('ready')
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
  /** 목표 구도(얼굴 34% · 눈높이 40%)를 얼마나 지켰는지. 1 이면 완전히 지킴 */
  quality: number
}

/** 가이드 박스(얼굴을 맞출 목표 영역)를 원본 프레임 픽셀 좌표로 계산합니다. */
export function guideRect(frameWidth: number, frameHeight: number): CropRect {
  let height = frameHeight * TARGET.guideHeight
  let width = height * TARGET.aspect
  if (width > frameWidth * 0.96) {
    width = frameWidth * 0.96
    height = width / TARGET.aspect
  }
  return { x: (frameWidth - width) / 2, y: (frameHeight - height) / 2, width, height, quality: 1 }
}

/**
 * 감지한 얼굴 위치를 기준으로 최종 4:5 크롭 영역을 계산합니다.
 * 얼굴이 없으면 화면 중앙 가이드 영역을 그대로 사용합니다.
 */
/**
 * 감지한 얼굴 위치를 기준으로 최종 4:5 크롭 영역을 계산합니다.
 *
 * 사각형을 만든 뒤 위치를 밀어 넣는(clamp) 방식은 눈높이와 좌우 중심이
 * 조용히 어긋나기 때문에, 여기서는 **앵커(눈높이·얼굴 중심)를 고정한 채
 * 높이 H 만 줄여** 프레임 안에 들어오게 만듭니다.
 *
 *   y = eyeY - 0.40H ≥ 0             → H ≤ eyeY / 0.40
 *   y + H = eyeY + 0.60H ≤ frameH    → H ≤ (frameH - eyeY) / 0.60
 *   x = cx - 0.40H ≥ 0               → H ≤ cx / 0.40        (W = 0.8H)
 *   x + W = cx + 0.40H ≤ frameW      → H ≤ (frameW - cx) / 0.40
 */
export function computeCrop(box: FaceBox | null, frameWidth: number, frameHeight: number): CropRect {
  if (!box || !frameWidth || !frameHeight) return guideRect(frameWidth, frameHeight)

  const eyeY = box.eyeY * frameHeight
  const centerX = box.centerX * frameWidth
  const idealHeight = (box.height * frameHeight) / TARGET.faceHeight
  const halfWidthRatio = TARGET.aspect / 2

  const height = Math.min(
    idealHeight,
    frameHeight,
    frameWidth / TARGET.aspect,
    eyeY / TARGET.eyeLine,
    (frameHeight - eyeY) / (1 - TARGET.eyeLine),
    centerX / halfWidthRatio,
    (frameWidth - centerX) / halfWidthRatio,
  )
  if (!(height > 0)) return guideRect(frameWidth, frameHeight)

  const width = height * TARGET.aspect
  return {
    x: clamp(centerX - width / 2, 0, Math.max(0, frameWidth - width)),
    y: clamp(eyeY - height * TARGET.eyeLine, 0, Math.max(0, frameHeight - height)),
    width,
    height,
    quality: Math.min(1, height / idealHeight),
  }
}

/**
 * 원본 프레임(비디오 또는 이미지)에서 크롭 영역을 잘라 4:5 캔버스로 그립니다.
 * 지나친 확대는 하지 않습니다.
 */
export function renderCrop(
  source: CanvasImageSource,
  crop: CropRect,
  options: { mirror?: boolean } = {},
): HTMLCanvasElement {
  // 축소만 합니다. 하한값을 두면 상한(maxUpscale)이 무력화되어 몰래 확대됩니다.
  const scale = Math.min(TARGET.outputHeight / crop.height, TARGET.maxUpscale)
  const height = Math.max(1, Math.round(crop.height * scale))
  const width = Math.round(height * TARGET.aspect)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return canvas
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#FAF8F4'
  context.fillRect(0, 0, width, height)
  if (options.mirror) {
    context.translate(width, 0)
    context.scale(-1, 1)
  }
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
  return canvas
}

/**
 * 밝기(0~255)를 잽니다. region 을 주면 그 영역만 재기 때문에,
 * 창을 등진 역광에서 화면 전체는 밝지만 얼굴만 어두운 경우도 잡아냅니다.
 */
export function measureLuma(
  source: CanvasImageSource,
  width: number,
  height: number,
  region?: CropRect,
): number | null {
  if (!width || !height) return null
  const sampleWidth = 48
  const sampleHeight = Math.max(1, Math.round((sampleWidth * height) / width))
  const canvas = document.createElement('canvas')
  canvas.width = sampleWidth
  canvas.height = sampleHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  try {
    if (region && region.width > 0 && region.height > 0) {
      context.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, sampleWidth, sampleHeight)
    } else {
      context.drawImage(source, 0, 0, sampleWidth, sampleHeight)
    }
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight)
    let total = 0
    for (let index = 0; index < data.length; index += 4) {
      total += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]
    }
    return total / (data.length / 4)
  } catch {
    return null
  }
}
