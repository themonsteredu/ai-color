import { TARGET, guideRect } from '../face/framing'
import type { AlignmentStatus } from '../face/framing'

interface CameraGuideProps {
  width: number
  height: number
  status: AlignmentStatus
}

/**
 * 미리보기 위에 겹치는 촬영 가이드.
 * 비디오 픽셀 좌표를 그대로 viewBox 로 쓰기 때문에, 컨테이너 비율만
 * 영상 비율과 같게 맞추면 가이드와 실제 촬영 영역이 정확히 일치합니다.
 */
export function CameraGuide({ width, height, status }: CameraGuideProps) {
  if (!width || !height) return null

  const guide = guideRect(width, height)
  const faceHeight = guide.height * TARGET.faceHeight
  const faceWidth = faceHeight * TARGET.faceWidthRatio
  const eyeY = guide.y + guide.height * TARGET.eyeLine
  const faceCenterY = eyeY + faceHeight * (0.5 - TARGET.eyeInFace)
  const centerX = guide.x + guide.width / 2
  // 어깨선은 목표 구도에서 계산합니다. (턱 아래 0.45 얼굴높이)
  const chinY = eyeY + faceHeight * (1 - TARGET.eyeInFace)
  const shoulderY = chinY + faceHeight * TARGET.shoulderBelowChin
  const shoulderLift = guide.height * 0.05
  const radius = Math.min(guide.width, guide.height) * 0.06
  const tick = Math.min(guide.width, guide.height) * 0.09
  const stroke = Math.max(2, height * 0.004)

  const isReady = status === 'ready'
  const accent = isReady ? '#5FBE8E' : '#FFFFFF'
  const faceAccent = isReady ? '#5FBE8E' : status === 'searching' ? 'rgba(255,255,255,.75)' : '#FFC59B'

  const corner = (x: number, y: number, dx: number, dy: number) => (
    <path
      d={`M ${x} ${y + dy * tick} L ${x} ${y} L ${x + dx * tick} ${y}`}
      fill="none"
      stroke={accent}
      strokeWidth={stroke * 1.6}
      strokeLinecap="round"
    />
  )

  return (
    <svg
      className="camera-guide"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id="camera-guide-mask">
          <rect x="0" y="0" width={width} height={height} fill="#fff" />
          <rect x={guide.x} y={guide.y} width={guide.width} height={guide.height} rx={radius} fill="#000" />
        </mask>
      </defs>

      {/* 촬영에 쓰이지 않는 바깥 영역을 살짝 어둡게 */}
      <rect x="0" y="0" width={width} height={height} fill="rgba(24,20,17,.42)" mask="url(#camera-guide-mask)" />

      <rect
        x={guide.x}
        y={guide.y}
        width={guide.width}
        height={guide.height}
        rx={radius}
        fill="none"
        stroke={isReady ? accent : 'rgba(255,255,255,.55)'}
        strokeWidth={stroke}
      />
      {corner(guide.x, guide.y, 1, 1)}
      {corner(guide.x + guide.width, guide.y, -1, 1)}
      {corner(guide.x, guide.y + guide.height, 1, -1)}
      {corner(guide.x + guide.width, guide.y + guide.height, -1, -1)}

      {/* 얼굴 위치 */}
      <ellipse
        cx={centerX}
        cy={faceCenterY}
        rx={faceWidth / 2}
        ry={faceHeight / 2}
        fill="none"
        stroke={faceAccent}
        strokeWidth={stroke * 1.4}
        strokeDasharray={isReady ? undefined : `${stroke * 5} ${stroke * 4}`}
      />

      {/* 눈높이 */}
      <line
        x1={centerX - faceWidth * 0.86}
        y1={eyeY}
        x2={centerX - faceWidth * 0.56}
        y2={eyeY}
        stroke={faceAccent}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <line
        x1={centerX + faceWidth * 0.56}
        y1={eyeY}
        x2={centerX + faceWidth * 0.86}
        y2={eyeY}
        stroke={faceAccent}
        strokeWidth={stroke}
        strokeLinecap="round"
      />

      {/* 어깨 라인 */}
      <path
        d={`M ${guide.x + guide.width * 0.06} ${shoulderY + shoulderLift}
            Q ${centerX} ${shoulderY - shoulderLift * 1.5} ${guide.x + guide.width * 0.94} ${shoulderY + shoulderLift}`}
        fill="none"
        stroke={faceAccent}
        strokeWidth={stroke * 1.2}
        strokeDasharray={`${stroke * 5} ${stroke * 4}`}
        strokeLinecap="round"
      />
    </svg>
  )
}
