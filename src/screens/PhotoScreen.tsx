import { Camera, ImagePlus, LoaderCircle, Maximize, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CameraGuide } from '../components/CameraGuide'
import { JourneyBar } from '../components/JourneyBar'
import { describeCamera, openCamera, stopStream } from '../face/camera'
import { prefetchLandmarkerAssets } from '../face/landmarker'
import { computeCrop, faceBoxFromLandmarks, renderCrop } from '../face/framing'
import { detectLandmarks } from '../face/useFaceLandmarks'
import { useCameraGuide } from '../face/useCameraGuide'

interface PhotoScreenProps {
  onPhoto: (url: string) => void
  onBack: () => void
}

type CameraState = 'idle' | 'loading' | 'active' | 'blocked'

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95))
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('사진을 열지 못했어요.'))
    image.src = url
  })
}

export function PhotoScreen({ onPhoto, onBack }: PhotoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [consent, setConsent] = useState(false)
  const [autoCapture, setAutoCapture] = useState(true)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [frame, setFrame] = useState({ width: 0, height: 0 })

  const isLive = cameraState === 'active'
  const { alignment, guideState, getFace } = useCameraGuide(videoRef, isLive)

  const stopCamera = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    setCameraState('idle')
    setCountdown(null)
  }, [])

  useEffect(() => () => stopStream(streamRef.current), [])

  // 카메라를 켜기 전에 얼굴 인식 파일을 미리 받아 두면 대기 시간이 줄어듭니다.
  useEffect(() => {
    prefetchLandmarkerAssets()
  }, [])

  const startCamera = async () => {
    setCameraState('loading')
    setError('')
    try {
      const { stream } = await openCamera()
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
        setFrame({ width: video.videoWidth, height: video.videoHeight })
      }
      setCameraState('active')
    } catch {
      setCameraState('blocked')
    }
  }

  const capture = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || busy) return
    setBusy(true)
    try {
      // 감지한 얼굴 위치로 4:5 구도를 자동으로 맞춰 잘라냅니다.
      // 얼굴을 놓친 지 오래됐다면 화면 중앙 가이드 영역으로 대신 잘라냅니다.
      const crop = computeCrop(getFace(), video.videoWidth, video.videoHeight)
      const canvas = renderCrop(video, crop, { mirror: true })
      const blob = await canvasToBlob(canvas)
      if (!blob) throw new Error('사진을 저장하지 못했어요.')
      stopCamera()
      onPhoto(URL.createObjectURL(blob))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '사진을 저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }, [busy, getFace, onPhoto, stopCamera])

  const captureRef = useRef(capture)
  captureRef.current = capture

  // 정렬이 맞으면 3초 뒤 자동으로 촬영합니다. 자세가 흐트러지면 즉시 취소됩니다.
  useEffect(() => {
    if (!autoCapture || !isLive || busy || alignment.status !== 'ready') {
      setCountdown(null)
      return
    }
    let value = 3
    setCountdown(value)
    const timer = window.setInterval(() => {
      value -= 1
      if (value <= 0) {
        window.clearInterval(timer)
        setCountdown(null)
        // 마지막 순간에 얼굴을 놓쳤다면 촬영하지 않고 다시 안내로 돌아갑니다.
        if (getFace()) void captureRef.current()
      } else {
        setCountdown(value)
      }
    }, 900)
    return () => window.clearInterval(timer)
  }, [autoCapture, isLive, busy, alignment.status, getFace])

  const upload = async (file?: File) => {
    if (!file || busy) return
    setBusy(true)
    setError('')
    const sourceUrl = URL.createObjectURL(file)
    try {
      const image = await loadImage(sourceUrl)
      const landmarks = await detectLandmarks(image)
      const box = landmarks ? faceBoxFromLandmarks(landmarks) : null
      stopCamera()
      if (!box) {
        // 얼굴을 못 찾으면 원본을 그대로 씁니다. (임의로 자르면 인물이 잘릴 수 있어요)
        onPhoto(sourceUrl)
        return
      }
      const canvas = renderCrop(image, computeCrop(box, image.naturalWidth, image.naturalHeight))
      const blob = await canvasToBlob(canvas)
      URL.revokeObjectURL(sourceUrl)
      if (!blob) throw new Error('사진을 준비하지 못했어요.')
      onPhoto(URL.createObjectURL(blob))
    } catch (caught) {
      URL.revokeObjectURL(sourceUrl)
      setError(caught instanceof Error ? caught.message : '사진을 준비하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  // 미리보기 틀을 카메라 실제 비율과 같게 맞춰야 화면이 잘리지 않고 가이드가 정확히 겹칩니다.
  const frameStyle = frame.width && frame.height ? ({ '--cam-aspect': `${frame.width} / ${frame.height}` } as CSSProperties) : undefined
  const cameraInfo = frame.width && frame.height ? describeCamera(frame.width, frame.height) : null

  return (
    <div className="page">
      <JourneyBar current="photo" title="내 사진 준비하기" subtitle="STEP 6 · 스타일링에 사용할 사진" onBack={onBack} />
      <main className="page__body">
        <div className="shell">
          <div className="photo">
            <section className="stack">
              <div>
                <span className="eyebrow">MY PHOTO</span>
                <h1 style={{ fontSize: 'var(--fs-display)', lineHeight: 'var(--lh-display)', marginTop: 6 }}>
                  가이드에 얼굴과 어깨를 맞춰 주세요
                </h1>
                <p className="lead" style={{ marginTop: 12 }}>
                  얼굴이 타원 안에, 어깨가 아래 곡선에 닿으면 딱 좋아요. 이 사진 위에 메이크업을 올려 보고 마지막 AI
                  스타일링에도 그대로 사용합니다.
                </p>
              </div>

              <div className="photo__tips">
                <div className="tip">
                  <UserRound size={20} aria-hidden="true" />
                  <span>
                    <b>얼굴은 타원 안에.</b> 눈높이가 좌우 눈금선과 비슷한 높이면 정확해요.
                  </span>
                </div>
                <div className="tip">
                  <Maximize size={20} aria-hidden="true" />
                  <span>
                    <b>한 걸음 뒤로.</b> 카메라에 너무 가까우면 얼굴만 크게 나와요. 어깨까지 보이게 떨어져 주세요.
                  </span>
                </div>
                <div className="tip">
                  <Sparkles size={20} aria-hidden="true" />
                  <span>
                    <b>구도는 자동으로 정리돼요.</b> 얼굴 위치를 인식해서 촬영 후 4:5 인물 사진으로 알아서 맞춥니다.
                  </span>
                </div>
                <div className="tip">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <span>사진은 기기에만 두고, 마지막 &lsquo;AI로 내 스타일 완성하기&rsquo;를 누를 때 1회만 전송됩니다.</span>
                </div>
              </div>

              <label className="consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span>최종 스타일 생성을 위해 내가 고른 사진이 OpenAI 이미지 API에서 처리되는 것에 동의합니다.</span>
              </label>
            </section>

            <section className="stack">
              <div className={`camera-frame${isLive ? ' is-live' : ''}`} style={frameStyle}>
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  aria-label="전면 카메라 미리보기"
                  onLoadedMetadata={(event) =>
                    setFrame({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight })
                  }
                />
                {isLive ? <CameraGuide width={frame.width} height={frame.height} status={alignment.status} /> : null}

                {countdown !== null ? (
                  <div className="camera-countdown" aria-hidden="true">
                    <span>{countdown}</span>
                  </div>
                ) : null}

                {!isLive ? (
                  <div className="camera-frame__empty">
                    <Camera size={40} aria-hidden="true" />
                    <strong>{cameraState === 'blocked' ? '카메라를 사용할 수 없어요' : '얼굴 + 어깨 정면 사진'}</strong>
                    <span className="muted">
                      {cameraState === 'blocked'
                        ? '아래에서 갤러리 사진을 선택해 주세요.'
                        : '전신사진은 필요하지 않아요.'}
                    </span>
                  </div>
                ) : null}
              </div>

              {isLive ? (
                <div className={`camera-status${alignment.status === 'ready' ? ' is-ready' : ''}`} role="status">
                  <strong>{alignment.message}</strong>
                  <small>{alignment.hint}</small>
                </div>
              ) : null}

              {isLive ? (
                <div className="camera-meta">
                  <span className="badge badge--outline">
                    카메라 {frame.width}×{frame.height}
                  </span>
                  <span className="badge badge--outline">
                    {guideState === 'ready'
                      ? '얼굴 인식 켜짐'
                      : guideState === 'loading'
                        ? '얼굴 인식 준비 중'
                        : '가이드만 사용'}
                  </span>
                  <label className="camera-toggle">
                    <input type="checkbox" checked={autoCapture} onChange={(event) => setAutoCapture(event.target.checked)} />
                    <span>자동 촬영</span>
                  </label>
                </div>
              ) : null}

              {cameraInfo?.lowResolution && isLive ? (
                <p className="note note--neutral">
                  <span>
                    <strong>이 카메라는 화질이 낮아요</strong>
                    창가처럼 밝은 곳에서 찍으면 나아집니다. 더 선명한 결과를 원하면 휴대폰으로 찍은 사진을 &lsquo;갤러리에서
                    선택&rsquo;으로 올려 주세요.
                  </span>
                </p>
              ) : null}

              {error ? (
                <p className="alert" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="btn-row">
                {isLive ? (
                  <button className="btn btn--primary btn--lg" type="button" onClick={capture} disabled={busy}>
                    {busy ? <LoaderCircle size={20} aria-hidden="true" /> : <Camera size={20} aria-hidden="true" />}
                    {busy ? '사진 정리 중…' : '지금 촬영하기'}
                  </button>
                ) : (
                  <button
                    className="btn btn--primary btn--lg"
                    type="button"
                    onClick={startCamera}
                    disabled={!consent || cameraState === 'loading'}
                  >
                    <Camera size={20} aria-hidden="true" />
                    {cameraState === 'loading' ? '카메라 여는 중…' : '카메라로 찍기'}
                  </button>
                )}
                <label className={`btn btn--secondary btn--lg file-button${consent && !busy ? '' : ' is-disabled'}`}>
                  <ImagePlus size={20} aria-hidden="true" />
                  갤러리에서 선택
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!consent || busy}
                    onChange={(event) => upload(event.target.files?.[0])}
                  />
                </label>
              </div>
              {!consent ? <p className="muted">동의를 체크하면 촬영과 사진 선택을 시작할 수 있어요.</p> : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
